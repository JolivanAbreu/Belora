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
    // Segredo TOTP em base32. Gravado assim que o admin inicia o setup
    // (POST /auth/2fa/setup), mas só passa a valer para login depois de
    // confirmado via POST /auth/2fa/enable (ver twoFactorEnabled).
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  twoFactorBackupCodes: {
    type: DataTypes.JSONB,
    allowNull: true,
    // Array de códigos de backup, armazenados como HASH (bcrypt), nunca em
    // texto plano - mesmo padrão de senha. Cada código só pode ser usado
    // uma vez (é removido do array ao ser consumido).
  },
}, {
  tableName: "users",
  timestamps: true,
  // email é único globalmente (login não exige selecionar o tenant antes) -
  // ver Documento de Arquitetura, módulo de contas. Se no futuro um mesmo
  // e-mail precisar administrar mais de um tenant, este ponto deve ser revisto.
});

module.exports = User;
