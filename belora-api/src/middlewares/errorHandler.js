/**
 * Middleware global de tratamento de erros.
 * Deve ser registrado por último no app.js (express-async-errors encaminha
 * erros de rotas async para cá automaticamente).
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.status) {
    // Erros de negócio esperados (409 de conflito, 404, 400, ...) não devem
    // poluir o log/Sentry como se fossem falha do sistema - apenas erros
    // 5xx inesperados são registrados como erro real.
    if (err.status >= 500) console.error(err);
    return res.status(err.status).json({ error: { code: err.code || "ERROR", message: err.message } });
  }

  console.error(err);

  if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: err.errors?.[0]?.message || err.message } });
  }

  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor." } });
}

/** Helper para lançar erros com status/code a partir dos services/controllers. */
class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

module.exports = { errorHandler, AppError };
