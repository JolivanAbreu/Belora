const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ServiceCategory = sequelize.define("ServiceCategory", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: "service_categories",
  timestamps: true,
});

module.exports = ServiceCategory;
