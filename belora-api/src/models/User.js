const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("admin", "colaborador"), allowNull: false, defaultValue: "admin" },
}, {
  tableName: "users",
  timestamps: true,
  // email é único globalmente (login não exige selecionar o tenant antes) -
  // ver Documento de Arquitetura, módulo de contas. Se no futuro um mesmo
  // e-mail precisar administrar mais de um tenant, este ponto deve ser revisto.
});

module.exports = User;
