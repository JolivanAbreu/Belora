const authService = require("./auth.service");

async function login(req, res) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  res.json(result);
}

module.exports = { login, refresh };
