"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notifications_log", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      appointment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "appointments", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      channel: { type: Sequelize.ENUM("whatsapp", "email", "sms"), allowNull: false },
      type: {
        type: Sequelize.ENUM("confirmation", "reminder_24h", "reminder_2h", "reminder_30min"),
        allowNull: false,
        defaultValue: "confirmation",
      },
      sent_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("notifications_log", ["appointment_id", "type"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("notifications_log");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_log_channel";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_log_type";');
  },
};
