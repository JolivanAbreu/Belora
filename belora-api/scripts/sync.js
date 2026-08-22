/**
 * Script de sincronização de schema para DESENVOLVIMENTO LOCAL apenas.
 *
 * Em produção, o Plano de Deploy (seção 4) exige migrations aditivas e
 * retrocompatíveis via Sequelize CLI, nunca sequelize.sync(). Este script
 * existe só para acelerar o setup local enquanto as migrations formais
 * ainda não foram escritas.
 */
require("dotenv").config();
const { sequelize } = require("../src/models");

sequelize.sync({ alter: true })
  .then(() => {
    console.log("Schema sincronizado com sucesso.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Erro ao sincronizar schema:", err);
    process.exit(1);
  });
