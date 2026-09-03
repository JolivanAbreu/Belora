const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NotificationLog = sequelize.define("NotificationLog", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  appointmentId: { type: DataTypes.UUID, allowNull: false },
  channel: { type: DataTypes.ENUM("whatsapp", "email", "sms"), allowNull: false },
  type: {
    type: DataTypes.ENUM("confirmation", "reminder_24h", "reminder_2h", "reminder_30min"),
    allowNull: false,
    defaultValue: "confirmation",
    // Usado tanto para exibir o motivo do envio na tela de Notificações
    // quanto para evitar reenvio duplicado do mesmo lembrete pelo job de
    // varredura (ver src/jobs/reminders.job.js).
  },
  sentAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "notifications_log",
  timestamps: true,
  indexes: [{ fields: ["appointment_id", "type"] }],
});

module.exports = NotificationLog;
