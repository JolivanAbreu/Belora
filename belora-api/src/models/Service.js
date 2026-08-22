const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Service = sequelize.define("Service", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  categoryId: { type: DataTypes.UUID, allowNull: true },
  name: { type: DataTypes.STRING, allowNull: false },
  durationMin: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 5 } },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: "services",
  timestamps: true,
  paranoid: true, // soft-delete - preferir desativar (active=false) a excluir, ver Modelo de Dados seção 5
  indexes: [{ fields: ["tenant_id", "active"] }],
});

module.exports = Service;
