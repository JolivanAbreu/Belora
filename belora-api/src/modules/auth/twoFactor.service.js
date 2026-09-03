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

/**
 * Inicia a configuração de 2FA: gera um novo segredo TOTP e devolve o QR
 * code para escanear num app autenticador (Google Authenticator, Authy,
 * etc.). O segredo fica gravado no usuário, mas 2FA só passa a ser exigido
 * no login depois da confirmação via enableTwoFactor.
 */
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

/**
 * Confirma o setup: valida o código de 6 dígitos gerado a partir do
 * segredo pendente e, se bater, ativa o 2FA de fato e gera os códigos de
 * backup (mostrados ao admin uma única vez, em texto puro).
 */
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

/**
 * Desativa o 2FA - exige a senha atual como confirmação, já que remove uma
 * camada de segurança da conta.
 */
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

/**
 * Verifica um código no momento do login (segunda etapa, depois da senha).
 * Aceita tanto um código TOTP de 6 dígitos quanto um código de backup - se
 * for um código de backup válido, ele é consumido (removido da lista) para
 * não poder ser reaproveitado.
 */
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

  // Não era um código TOTP válido - tenta como código de backup.
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
