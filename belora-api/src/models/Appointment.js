const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Appointment = sequelize.define("Appointment", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  clientId: { type: DataTypes.UUID, allowNull: false },
  serviceId: { type: DataTypes.UUID, allowNull: false },
  startsAt: { type: DataTypes.DATE, allowNull: false },
  endsAt: { type: DataTypes.DATE, allowNull: false },
  status: {
    type: DataTypes.ENUM("confirmado", "cancelado", "concluido", "nao_compareceu"),
    allowNull: false,
    defaultValue: "confirmado",
  },
}, {
  tableName: "appointments",
  timestamps: true,
  indexes: [{ fields: ["tenant_id", "starts_at"] }],
});

module.exports = Appointment;
