const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Tenant = sequelize.define("Tenant", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  businessHours: {
    type: DataTypes.JSONB,
    allowNull: false,
    // Estrutura: { mon: [["09:00","18:00"]], tue: [...], ..., sun: [] }
    // Os horários são sempre HORA LOCAL do tenant (ver campo `timezone` abaixo),
    // nunca UTC - a conversão para instante UTC acontece no availability.service.
    defaultValue: {
      mon: [["09:00", "18:00"]], tue: [["09:00", "18:00"]], wed: [["09:00", "18:00"]],
      thu: [["09:00", "18:00"]], fri: [["09:00", "18:00"]], sat: [["09:00", "13:00"]], sun: [],
    },
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "America/Fortaleza",
    // Fuso IANA do tenant. Usado para interpretar corretamente businessHours
    // e horários informados por admin/cliente como hora local (ver Segurança
    // & Arquitetura - antes desta correção, tudo era tratado como UTC puro).
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
    // Endereço em texto livre, exibido nas mensagens de WhatsApp (RF-33/50/52)
    // via o placeholder {endereco} nos templates - ver messageTemplates.
  },
  messageTemplates: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    // Templates de mensagem editáveis pelo admin (tela Configurações), por
    // tipo de notificação. Chaves ausentes usam o texto padrão do sistema
    // (ver DEFAULT_MESSAGE_TEMPLATES em notifications.service.js).
    // Placeholders disponíveis: {cliente} {servico} {data} {hora}
    // {estabelecimento} {endereco} {link_cancelamento} {link_confirmacao}
  },
  planId: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "tenants",
  timestamps: true,
  paranoid: true, // soft-delete (deleted_at) - ver Modelo de Dados, seção 4
});

module.exports = Tenant;
