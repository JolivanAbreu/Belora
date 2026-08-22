process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgres://belora:belora@127.0.0.1:5432/belora_test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

const { sequelize } = require("../../src/models");

async function resetDatabase() {
  await sequelize.sync({ force: true });
}

async function closeDatabase() {
  await sequelize.close();
}

module.exports = { sequelize, resetDatabase, closeDatabase };
