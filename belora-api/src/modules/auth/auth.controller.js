const authService = require("./auth.service");
const twoFactorService = require("./twoFactor.service");
const { User } = require("../../models");

async function login(req, res) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
}

async function verifyTwoFactorLogin(req, res) {
  const { twoFactorSessionToken, code } = req.body;
  const result = await authService.verifyTwoFactorLogin(twoFactorSessionToken, code);
  res.json(result);
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  res.json(result);
}

async function setupTwoFactor(req, res) {
  const result = await twoFactorService.setupTwoFactor(req.user.id);
  res.json(result);
}

async function enableTwoFactor(req, res) {
  const result = await twoFactorService.enableTwoFactor(req.user.id, req.body.token);
  res.json(result);
}

async function disableTwoFactor(req, res) {
  await twoFactorService.disableTwoFactor(req.user.id, req.body.password);
  res.status(204).send();
}

async function getMe(req, res) {
  const user = await User.findByPk(req.user.id, {
    attributes: ["id", "email", "role", "twoFactorEnabled"],
  });
  res.json(user);
}

module.exports = {
  login,
  verifyTwoFactorLogin,
  refresh,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  getMe,
};
