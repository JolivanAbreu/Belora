const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AvailabilityBlock = sequelize.define("AvailabilityBlock", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  startsAt: { type: DataTypes.DATE, allowNull: false },
  endsAt: { type: DataTypes.DATE, allowNull: false },
  reason: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "availability_blocks",
  timestamps: true,
  indexes: [{ fields: ["tenant_id", "starts_at"] }],
});

module.exports = AvailabilityBlock;
