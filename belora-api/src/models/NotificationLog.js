const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NotificationLog = sequelize.define("NotificationLog", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  appointmentId: { type: DataTypes.UUID, allowNull: false },
  channel: { type: DataTypes.ENUM("whatsapp", "email", "sms"), allowNull: false },
  sentAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "notifications_log",
  timestamps: true,
});

module.exports = NotificationLog;
