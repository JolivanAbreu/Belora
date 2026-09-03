// Config usada pelo Sequelize CLI (migrations). Diferente de config/database.js
// (usado pela aplicação em runtime), este arquivo precisa exportar objetos
// simples síncronos - não pode instanciar Sequelize diretamente.
require("dotenv").config();

const base = {
  use_env_variable: "DATABASE_URL",
  dialect: "postgres",
  define: { underscored: true },
};

module.exports = {
  development: base,
  test: { ...base, use_env_variable: "TEST_DATABASE_URL" },
  production: base,
};
