const jwt = require("jsonwebtoken");

/**
 * Middleware de autenticação do PAINEL ADMINISTRATIVO.
 *
 * Regra de segurança crítica (ver Documento de Segurança & LGPD, seção 3):
 * o tenantId usado em toda a aplicação vem SEMPRE do token JWT verificado
 * aqui, nunca de um parâmetro, header ou body enviado pelo cliente.
 * Isso é o que impede um admin do Tenant A de acessar dados do Tenant B
 * simplesmente alterando um valor na requisição.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Token não informado." } });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // req.user.tenantId é a única fonte confiável de tenant a partir daqui
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
