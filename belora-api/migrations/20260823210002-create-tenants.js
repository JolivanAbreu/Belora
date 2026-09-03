"use strict";

const DEFAULT_BUSINESS_HOURS = {
  mon: [["09:00", "18:00"]], tue: [["09:00", "18:00"]], wed: [["09:00", "18:00"]],
  thu: [["09:00", "18:00"]], fri: [["09:00", "18:00"]], sat: [["09:00", "13:00"]], sun: [],
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tenants", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      business_hours: { type: Sequelize.JSONB, allowNull: false, defaultValue: DEFAULT_BUSINESS_HOURS },
      timezone: { type: Sequelize.STRING, allowNull: false, defaultValue: "America/Fortaleza" },
      address: { type: Sequelize.STRING, allowNull: true },
      message_templates: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      plan_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "plans", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true }, // soft-delete (paranoid) - ver Modelo de Dados
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tenants");
  },
};
