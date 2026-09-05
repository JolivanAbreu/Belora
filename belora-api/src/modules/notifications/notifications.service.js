const { formatInTimeZone } = require("date-fns-tz");
const { NotificationLog, Appointment, Client, Service } = require("../../models");
const { getWhatsAppProvider } = require("../../integrations/whatsapp");

// Histórico de notificações do tenant.
async function list(tenantId, { appointmentId } = {}) {
  const where = { tenantId };
  if (appointmentId) where.appointmentId = appointmentId;

  return NotificationLog.findAll({
    where,
    include: [{ model: Appointment, include: [Client, Service] }],
    order: [["sentAt", "DESC"]],
    limit: 100,
  });
}

// Usados quando o tenant não personalizou o template em Configurações.
// Placeholders: {cliente} {servico} {data} {hora} {estabelecimento}
// {endereco} {link_cancelamento} {link_confirmacao}
const DEFAULT_MESSAGE_TEMPLATES = {
  confirmation:
    "Olá, {cliente}! Seu agendamento de {servico} foi confirmado para {data} às {hora}, " +
    "com {estabelecimento}. Endereço: {endereco}\n\nPrecisa cancelar? {link_cancelamento}",
  reminder_24h:
    "Olá, {cliente}! Passando para lembrar: você tem {servico} amanhã às {hora}, com " +
    "{estabelecimento}. Endereço: {endereco}\n\nPrecisa cancelar? {link_cancelamento}",
  reminder_2h:
    "Olá, {cliente}! Seu horário de {servico} é daqui a pouco, às {hora}, com " +
    "{estabelecimento}. Te esperamos!",
  reminder_30min:
    "Olá, {cliente}! Faltam 30 minutos para o seu {servico} às {hora}, com {estabelecimento}. " +
    "Endereço: {endereco}\n\nPor favor confirme sua presença: {link_confirmacao}\n" +
    "Precisa cancelar? {link_cancelamento}",
};

const TYPES_WITH_CONFIRM_LINK = new Set(["reminder_30min"]);


const PUBLIC_BOOKING_URL = process.env.PUBLIC_BOOKING_URL || "http://localhost:5174";

function renderTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
}

// Envia e registra a notificação. Falha de envio não grava o log, o que
// permite ao job de varredura tentar de novo na próxima passada.
async function sendAndLog(appointment, type) {
  const client = appointment.Client;
  const service = appointment.Service;
  const tenant = appointment.Tenant;

  if (!client?.phone) return { ok: false, error: "Cliente sem telefone cadastrado." };

  const timezone = tenant?.timezone || "America/Fortaleza";
  const template = tenant?.messageTemplates?.[type] || DEFAULT_MESSAGE_TEMPLATES[type];

  const cancelUrl = tenant?.slug
    ? `${PUBLIC_BOOKING_URL}/${tenant.slug}/cancelar/${appointment.id}?token=${appointment.cancellationToken}`
    : "";
  const confirmUrl =
    tenant?.slug && TYPES_WITH_CONFIRM_LINK.has(type)
      ? `${PUBLIC_BOOKING_URL}/${tenant.slug}/confirmar/${appointment.id}?token=${appointment.cancellationToken}`
      : "";

  const message = renderTemplate(template, {
    cliente: client.name,
    servico: service?.name || "seu procedimento",
    estabelecimento: tenant?.name || "Belora",
    endereco: tenant?.address || "",
    data: formatInTimeZone(appointment.startsAt, timezone, "dd/MM"),
    hora: formatInTimeZone(appointment.startsAt, timezone, "HH:mm"),
    link_cancelamento: cancelUrl,
    link_confirmacao: confirmUrl,
  });

  const provider = getWhatsAppProvider();
  const result = await provider.send(client.phone, message);

  if (!result.ok) {
    console.error(`Falha ao enviar WhatsApp (${type}) para agendamento ${appointment.id}: ${result.error}`);
    return result;
  }

  await NotificationLog.create({
    tenantId: appointment.tenantId,
    appointmentId: appointment.id,
    channel: "whatsapp",
    type,
    sentAt: new Date(),
  });

  return result;
}

module.exports = { list, sendAndLog, DEFAULT_MESSAGE_TEMPLATES, renderTemplate };
