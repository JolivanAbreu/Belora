require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/database");

const PORT = process.env.PORT || 3000;

async function start() {
  await sequelize.authenticate();
  console.log("Conexão com o banco de dados estabelecida.");

  app.listen(PORT, () => {
    console.log(`Belora API rodando na porta ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Falha ao iniciar o servidor:", err);
  process.exit(1);
});
