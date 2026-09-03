"use strict";
const crypto = require("crypto");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("appointments", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "clients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      service_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "services", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      starts_at: { type: Sequelize.DATE, allowNull: false },
      ends_at: { type: Sequelize.DATE, allowNull: false },
      status: {
        type: Sequelize.ENUM("confirmado", "cancelado", "concluido", "nao_compareceu"),
        allowNull: false,
        defaultValue: "confirmado",
      },
      // Sem defaultValue a nível de banco (a lib "crypto" não existe em SQL);
      // o valor é sempre gerado pela aplicação (ver models/Appointment.js).
      // NOT NULL é garantido pela aplicação em toda criação.
      cancellation_token: { type: Sequelize.STRING, allowNull: false },
      presence_confirmed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("appointments", ["tenant_id", "starts_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("appointments");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_appointments_status";');
  },
};
