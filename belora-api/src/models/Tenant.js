const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Tenant = sequelize.define("Tenant", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  businessHours: {
    type: DataTypes.JSONB,
    allowNull: false,
    // { mon: [["09:00","18:00"]], ..., sun: [] } em hora local do tenant.
    defaultValue: {
      mon: [["09:00", "18:00"]], tue: [["09:00", "18:00"]], wed: [["09:00", "18:00"]],
      thu: [["09:00", "18:00"]], fri: [["09:00", "18:00"]], sat: [["09:00", "13:00"]], sun: [],
    },
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "America/Fortaleza",
    // Fuso IANA usado para interpretar businessHours e horários informados.
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
    // Exibido nas mensagens via o placeholder {endereco}.
  },
  messageTemplates: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    // Editáveis na tela Configurações, por tipo de notificação.
    // Chaves ausentes usam DEFAULT_MESSAGE_TEMPLATES.
  },
  planId: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "tenants",
  timestamps: true,
  paranoid: true,
});

module.exports = Tenant;
