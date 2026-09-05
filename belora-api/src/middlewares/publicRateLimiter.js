const rateLimit = require("express-rate-limit");

// Endpoints públicos não exigem autenticação, então ficam mais expostos a
// scraping. 60 req/min por IP acomoda uso legítimo sem abrir para varredura.
const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "TOO_MANY_REQUESTS", message: "Muitas requisições. Tente novamente em instantes." } },
});

module.exports = publicRateLimiter;
