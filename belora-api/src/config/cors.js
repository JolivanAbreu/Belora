// Sem ALLOWED_ORIGINS definida, libera qualquer origem (dev/test).
// Em produção, espera uma lista separada por vírgula com as URLs do painel
// admin e da booking page.
function buildCorsOptions() {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    return {};
  }

  return {
    origin(origin, callback) {
      // Requisições sem Origin (curl, server-to-server) não são bloqueadas:
      // CORS é proteção de navegador, não autenticação.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  };
}

module.exports = { buildCorsOptions };
