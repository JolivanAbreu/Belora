const { DataTypes } = require("sequelize");
const crypto = require("crypto");
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
  cancellationToken: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: () => crypto.randomBytes(20).toString("hex"),
    // Usado no link de cancelamento enviado por WhatsApp. Separado do UUID
    // de propósito: enumerar IDs não basta para cancelar em nome do cliente.
  },
  presenceConfirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    // Preenchido quando o cliente confirma presença pelo lembrete de 30min.
  },
}, {
  tableName: "appointments",
  timestamps: true,
  indexes: [{ fields: ["tenant_id", "starts_at"] }],
});

module.exports = Appointment;
