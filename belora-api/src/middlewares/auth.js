const jwt = require("jsonwebtoken");

// O tenantId vem sempre do JWT verificado aqui, nunca de um parâmetro ou
// body da requisição. É o que impede acesso cruzado entre tenants.
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Token não informado." } });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);


    req.user = {
      id: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Token inválido ou expirado." } });
  }
}

module.exports = authMiddleware;
