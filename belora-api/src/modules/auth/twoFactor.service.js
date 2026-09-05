const { Secret, TOTP } = require("otpauth");
const QRCode = require("qrcode");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { User } = require("../../models");
const { AppError } = require("../../middlewares/errorHandler");

const ISSUER = "Belora";
const BACKUP_CODES_COUNT = 8;

function buildTotp(email, base32Secret) {
  return new TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(base32Secret),
  });
}

// Gera o segredo e o QR code. O 2FA só passa a valer no login após a
// confirmação em enableTwoFactor.
async function setupTwoFactor(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuário não encontrado.");

  const secret = new Secret({ size: 20 });
  user.twoFactorSecret = secret.base32;
  user.twoFactorEnabled = false; // continua desabilitado até confirmar
  await user.save();

  const totp = buildTotp(user.email, secret.base32);
  const otpauthUrl = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return { secret: secret.base32, otpauthUrl, qrCodeDataUrl };
}

function generateBackupCodes() {
  return Array.from({ length: BACKUP_CODES_COUNT }, () =>
    crypto.randomBytes(5).toString("hex").toUpperCase().match(/.{1,5}/g).join("-")
  );
}

// Valida o código do app autenticador e ativa o 2FA, retornando os códigos
// de backup em texto puro (exibidos ao usuário uma única vez).
async function enableTwoFactor(userId, token) {
  const user = await User.findByPk(userId);
  if (!user || !user.twoFactorSecret) {
    throw new AppError(400, "TWO_FACTOR_NOT_SETUP", "Inicie o setup de 2FA antes de confirmar.");
  }

  const totp = buildTotp(user.email, user.twoFactorSecret);
  const delta = totp.validate({ token, window: 1 });
  if (delta === null) {
    throw new AppError(400, "INVALID_TOTP_CODE", "Código inválido. Confira o horário do seu celular e tente de novo.");
  }

  const backupCodes = generateBackupCodes();
  const hashedCodes = await Promise.all(backupCodes.map((code) => bcrypt.hash(code, 10)));

  user.twoFactorEnabled = true;
  user.twoFactorBackupCodes = hashedCodes;
  await user.save();

  return { backupCodes };
}

// Exige a senha atual, já que remove uma camada de segurança da conta.
async function disableTwoFactor(userId, password) {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuário não encontrado.");

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, "INVALID_PASSWORD", "Senha incorreta.");
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = null;
  user.twoFactorBackupCodes = null;
  await user.save();
}

// Aceita código TOTP ou de backup. Códigos de backup são consumidos no uso.
async function verifyTwoFactorCode(userId, code) {
  const user = await User.findByPk(userId);
  if (!user || !user.twoFactorEnabled) {
    throw new AppError(400, "TWO_FACTOR_NOT_ENABLED", "2FA não está ativo para este usuário.");
  }

  const totp = buildTotp(user.email, user.twoFactorSecret);
  const delta = totp.validate({ token: code, window: 1 });
  if (delta !== null) {
    return true;
  }

  // Não é um TOTP válido: tenta como código de backup.
  const backupCodes = user.twoFactorBackupCodes || [];
  for (let i = 0; i < backupCodes.length; i++) {
    const matches = await bcrypt.compare(code, backupCodes[i]);
    if (matches) {
      const remaining = [...backupCodes];
      remaining.splice(i, 1);
      user.twoFactorBackupCodes = remaining;
      await user.save();
      return true;
    }
  }

  throw new AppError(401, "INVALID_TWO_FACTOR_CODE", "Código de verificação inválido.");
}

module.exports = { setupTwoFactor, enableTwoFactor, disableTwoFactor, verifyTwoFactorCode };
