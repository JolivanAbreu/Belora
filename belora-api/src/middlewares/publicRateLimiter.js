const rateLimit = require("express-rate-limit");

/**
 * Limite de requisições para os endpoints públicos (/public/*), que não
 * exigem autenticação e por isso ficam mais expostos a abuso/scraping (ver
 * Referência de API, seção 9). 60 requisições por minuto por IP é generoso
 * o bastante para uso legítimo (uma cliente navegando e agendando), mas
 * dificulta varreduras automatizadas.
 */
const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "TOO_MANY_REQUESTS", message: "Muitas requisições. Tente novamente em instantes." } },
});

module.exports = publicRateLimiter;
