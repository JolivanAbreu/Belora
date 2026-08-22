const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../../models");
const { AppError } = require("../../middlewares/errorHandler");

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

async function login(email, password) {
  const user = await User.findOne({ where: { email } });

  // Mensagem de erro genérica de propósito: não revelar se o e-mail existe
  // (ver Plano de Testes, TC-20 - evitar enumeração de contas).
  const invalidCredentials = () => new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");

  if (!user) throw invalidCredentials();

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) throw invalidCredentials();

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

module.exports = { login, refresh, hashPassword };
