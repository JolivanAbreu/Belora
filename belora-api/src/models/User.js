const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("admin", "colaborador"), allowNull: false, defaultValue: "admin" },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true,
    // Gravado no setup, mas só vale para login após twoFactorEnabled.
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  twoFactorBackupCodes: {
    type: DataTypes.JSONB,
    allowNull: true,
    // Hashes bcrypt. Cada código é removido do array ao ser usado.
  },
}, {
  tableName: "users",
  timestamps: true,
  // email é único globalmente: o login não exige escolher o tenant antes.
});

module.exports = User;
