// Registrado por último em app.js. O express-async-errors encaminha erros
// de rotas async para cá automaticamente.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.status) {
    // Erros de negócio esperados não poluem o log; só 5xx são registrados.
    if (err.status >= 500) console.error(err);
    return res.status(err.status).json({ error: { code: err.code || "ERROR", message: err.message } });
  }

  console.error(err);

  if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: err.errors?.[0]?.message || err.message } });
  }

  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor." } });
}

// Erro com status e código HTTP, lançado pelos services.
class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

module.exports = { errorHandler, AppError };
