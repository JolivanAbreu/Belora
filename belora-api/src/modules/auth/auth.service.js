const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../../models");
const { AppError } = require("../../middlewares/errorHandler");
const twoFactorService = require("./twoFactor.service");

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, tenantId: user.tenantId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, tenantId: user.tenantId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
  );
}

// Token de curta duração que prova apenas que a senha já foi validada.
// Não dá acesso a nenhuma rota protegida.
function signTwoFactorSessionToken(user) {
  return jwt.sign(
    { sub: user.id, purpose: "2fa_login" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );
}

async function login(email, password) {
  const user = await User.findOne({ where: { email } });

  // Mensagem genérica de propósito, para não revelar se o e-mail existe.
  const invalidCredentials = () => new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");

  if (!user) throw invalidCredentials();

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) throw invalidCredentials();

  if (user.twoFactorEnabled) {
    return {
      twoFactorRequired: true,
      twoFactorSessionToken: signTwoFactorSessionToken(user),
    };
  }

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    tenantId: user.tenantId,
  };
}

// Segunda etapa do login quando o usuário tem 2FA ativo.
async function verifyTwoFactorLogin(twoFactorSessionToken, code) {
  let payload;
  try {
    payload = jwt.verify(twoFactorSessionToken, process.env.JWT_SECRET);
  } catch {
    throw new AppError(401, "INVALID_SESSION", "Sessão de login expirada. Faça login novamente.");
  }
  if (payload.purpose !== "2fa_login") {
    throw new AppError(401, "INVALID_SESSION", "Sessão de login inválida.");
  }

  await twoFactorService.verifyTwoFactorCode(payload.sub, code);

  const user = await User.findByPk(payload.sub);
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    tenantId: user.tenantId,
  };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token inválido ou expirado.");
  }

  const user = await User.findByPk(payload.sub);
  if (!user) throw new AppError(401, "INVALID_REFRESH_TOKEN", "Usuário não encontrado.");

  return { accessToken: signAccessToken(user) };
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

module.exports = { login, verifyTwoFactorLogin, refresh, hashPassword };
