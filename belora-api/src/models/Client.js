const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Client = sequelize.define("Client", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true }, // dado sensível - ver Segurança & LGPD, seção 4
}, {
  tableName: "clients",
  timestamps: true,
  paranoid: true,
  indexes: [{ fields: ["tenant_id", "phone"] }],
});

module.exports = Client;
