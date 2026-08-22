const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  define: {
    underscored: true, // colunas snake_case no banco (tenant_id, created_at, ...)
  },
});

module.exports = sequelize;
