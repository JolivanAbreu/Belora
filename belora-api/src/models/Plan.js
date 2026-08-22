const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Plan = sequelize.define("Plan", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  limits: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, {
  tableName: "plans",
  timestamps: true,
});

module.exports = Plan;
