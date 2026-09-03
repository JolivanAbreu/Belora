/**
 * Configuração de CORS.
 *
 * Em desenvolvimento/teste (sem ALLOWED_ORIGINS definida), libera qualquer
 * origem - conveniente para rodar os frontends em portas locais variadas.
 *
 * Em produção, ALLOWED_ORIGINS deve ser definida como uma lista separada por
 * vírgula com as URLs reais do painel admin e da booking page (ex.:
 * "https://belora-admin.pages.dev,https://belora-booking.pages.dev"). Uma
 * origem fora dessa lista recebe o request normalmente processado, mas sem
 * o header Access-Control-Allow-Origin - o navegador do cliente bloqueia a
 * leitura da resposta (a política de mesma origem do CORS é aplicada pelo
 * navegador, não pelo servidor).
 */
function buildCorsOptions() {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    // Nenhuma restrição configurada - comportamento permissivo (dev/test).
    return {};
  }

  return {
    origin(origin, callback) {
      // Requisições sem header Origin (ex.: curl, apps mobile, chamadas
      // server-to-server) não são bloqueadas - CORS é uma proteção de
      // navegador, não uma autenticação.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  };
}

module.exports = { buildCorsOptions };
