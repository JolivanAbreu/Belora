const { Op } = require("sequelize");
const { fromZonedTime } = require("date-fns-tz");
const { sequelize, Appointment, AvailabilityBlock, Service, Client, Tenant } = require("../../models");
const { AppError } = require("../../middlewares/errorHandler");
const notificationsService = require("../notifications/notifications.service");

// Strings com "Z" ou offset explícito já são instantes absolutos.
// Sem sufixo, o valor é hora local do tenant e precisa ser convertido.
function parseTenantDateTime(value, timezone) {
  if (!value || typeof value !== "string") {
    throw new Error("invalid datetime");
  }
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(value)) {
    return new Date(value);
  }
  return fromZonedTime(value, timezone);
}

// Usa advisory lock por tenant para impedir conflito de horário sob
// concorrência, sem bloquear a agenda de outros tenants.
async function createAppointment(tenantId, input) {
  let context;

  const appointment = await sequelize.transaction(async (t) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(hashtext(:tenantId))", {
      replacements: { tenantId },
      transaction: t,
    });

    const tenant = await Tenant.findByPk(tenantId, { transaction: t });
    if (!tenant) {
      throw new AppError(404, "TENANT_NOT_FOUND", "Tenant não encontrado.");
    }

    const service = await Service.findOne({ where: { id: input.serviceId, tenantId, active: true }, transaction: t });
    if (!service) {
      throw new AppError(404, "SERVICE_NOT_FOUND", "Serviço não encontrado para este tenant.");
    }

    let startsAt;
    try {
      startsAt = parseTenantDateTime(input.startsAt, tenant.timezone);
    } catch {
      throw new AppError(400, "INVALID_DATE", "Data/hora de início inválida.");
    }
    if (Number.isNaN(startsAt?.getTime())) {
      throw new AppError(400, "INVALID_DATE", "Data/hora de início inválida.");
    }

    const endsAt = new Date(startsAt.getTime() + service.durationMin * 60 * 1000);

    const client = await resolveClient(tenantId, input, t);

    const conflictingAppointment = await Appointment.findOne({
      where: {
        tenantId,
        status: "confirmado",
        startsAt: { [Op.lt]: endsAt },
        endsAt: { [Op.gt]: startsAt },
      },
      transaction: t,
    });
    if (conflictingAppointment) {
      throw new AppError(409, "SLOT_UNAVAILABLE", "Este horário acabou de ser reservado.");
    }

    const conflictingBlock = await AvailabilityBlock.findOne({
      where: {
        tenantId,
        startsAt: { [Op.lt]: endsAt },
        endsAt: { [Op.gt]: startsAt },
      },
      transaction: t,
    });
    if (conflictingBlock) {
      throw new AppError(409, "SLOT_BLOCKED", "Este horário está bloqueado na agenda.");
    }

    const created = await Appointment.create({
      tenantId,
      clientId: client.id,
      serviceId: service.id,
      startsAt,
      endsAt,
      status: "confirmado",
    }, { transaction: t });

    context = { tenant, service, client };
    return created;
  });

  // Envio fire-and-forget: falha de notificação não desfaz o agendamento.
  appointment.Tenant = context.tenant;
  appointment.Service = context.service;
  appointment.Client = context.client;
  notificationsService.sendAndLog(appointment, "confirmation").catch((err) => {
    console.error("Falha ao enviar confirmação por WhatsApp:", err);
  });

  return appointment;
}

async function resolveClient(tenantId, input, t) {
  if (input.clientId) {
    const client = await Client.findOne({ where: { id: input.clientId, tenantId }, transaction: t });
    if (!client) throw new AppError(404, "CLIENT_NOT_FOUND", "Cliente não encontrado para este tenant.");
    return client;
  }

  if (!input.client?.phone || !input.client?.name) {
    throw new AppError(400, "CLIENT_DATA_REQUIRED", "Informe nome e telefone do cliente.");
  }

  const [client] = await Client.findOrCreate({
    where: { tenantId, phone: input.client.phone },
    defaults: { tenantId, phone: input.client.phone, name: input.client.name },
    transaction: t,
  });

  return client;
}

async function listAppointments(tenantId, { from, to } = {}) {
  const where = { tenantId };
  if (from || to) {
    where.startsAt = {};
    if (from) where.startsAt[Op.gte] = new Date(from);
    if (to) where.startsAt[Op.lte] = new Date(to);
  }
  return Appointment.findAll({ where, include: [Client, Service], order: [["startsAt", "ASC"]] });
}

async function cancelAppointment(tenantId, appointmentId) {
  const appointment = await Appointment.findOne({ where: { id: appointmentId, tenantId } });
  if (!appointment) {
    throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Agendamento não encontrado para este tenant.");
  }
  appointment.status = "cancelado";
  await appointment.save();
  return appointment;
}

// Cancelamento pelo cliente final, autorizado pelo token do link enviado
// por WhatsApp. Não exige login.
async function cancelAppointmentByToken(tenantId, appointmentId, token) {
  const appointment = await Appointment.findOne({ where: { id: appointmentId, tenantId } });
  if (!appointment) {
    throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Agendamento não encontrado.");
  }
  if (!token || appointment.cancellationToken !== token) {
    throw new AppError(403, "INVALID_CANCELLATION_TOKEN", "Link de cancelamento inválido.");
  }
  if (appointment.status === "cancelado") {
    throw new AppError(409, "ALREADY_CANCELLED", "Este agendamento já estava cancelado.");
  }
  appointment.status = "cancelado";
  await appointment.save();
  return appointment;
}

// Confirmação de presença pelo cliente, via link do lembrete de 30min.
// Reutiliza o token de cancelamento como chave de autorização.
async function confirmPresenceByToken(tenantId, appointmentId, token) {
  const appointment = await Appointment.findOne({ where: { id: appointmentId, tenantId } });
  if (!appointment) {
    throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Agendamento não encontrado.");
  }
  if (!token || appointment.cancellationToken !== token) {
    throw new AppError(403, "INVALID_CANCELLATION_TOKEN", "Link inválido.");
  }
  if (appointment.status === "cancelado") {
    throw new AppError(409, "ALREADY_CANCELLED", "Este agendamento já foi cancelado.");
  }
  appointment.presenceConfirmedAt = new Date();
  await appointment.save();
  return appointment;
}

// Remove o registro do banco. Diferente de cancelAppointment, que apenas
// muda o status e preserva o histórico.
async function deleteAppointmentPermanently(tenantId, appointmentId) {
  const appointment = await Appointment.findOne({ where: { id: appointmentId, tenantId } });
  if (!appointment) {
    throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Agendamento não encontrado para este tenant.");
  }
  await appointment.destroy();
}

const VALID_STATUSES = ["confirmado", "cancelado", "concluido", "nao_compareceu"];

// Marcar um atendimento como concluído ou não compareceu alimenta os
// relatórios de faturamento e taxa de não comparecimento.
async function updateAppointmentStatus(tenantId, appointmentId, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError(400, "INVALID_STATUS", `Status deve ser um de: ${VALID_STATUSES.join(", ")}.`);
  }
  const appointment = await Appointment.findOne({ where: { id: appointmentId, tenantId } });
  if (!appointment) {
    throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Agendamento não encontrado para este tenant.");
  }
  appointment.status = status;
  await appointment.save();
  return appointment;
}

async function createAvailabilityBlock(tenantId, { startsAt, endsAt, reason }) {
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant não encontrado.");

  let start;
  let end;
  try {
    start = parseTenantDateTime(startsAt, tenant.timezone);
    end = parseTenantDateTime(endsAt, tenant.timezone);
  } catch {
    throw new AppError(400, "INVALID_DATE", "Data/hora inválida.");
  }

  if (start >= end) {
    throw new AppError(400, "INVALID_RANGE", "O horário final deve ser após o horário inicial.");
  }
  return AvailabilityBlock.create({ tenantId, startsAt: start, endsAt: end, reason });
}

async function updateAvailabilityBlock(tenantId, blockId, { startsAt, endsAt, reason }) {
  const block = await AvailabilityBlock.findOne({ where: { id: blockId, tenantId } });
  if (!block) {
    throw new AppError(404, "BLOCK_NOT_FOUND", "Bloqueio não encontrado para este tenant.");
  }

  const tenant = await Tenant.findByPk(tenantId);

  let start = block.startsAt;
  let end = block.endsAt;
  try {
    if (startsAt !== undefined) start = parseTenantDateTime(startsAt, tenant.timezone);
    if (endsAt !== undefined) end = parseTenantDateTime(endsAt, tenant.timezone);
  } catch {
    throw new AppError(400, "INVALID_DATE", "Data/hora inválida.");
  }

  if (start >= end) {
    throw new AppError(400, "INVALID_RANGE", "O horário final deve ser após o horário inicial.");
  }

  block.startsAt = start;
  block.endsAt = end;
  if (reason !== undefined) block.reason = reason;
  await block.save();
  return block;
}

async function deleteAvailabilityBlock(tenantId, blockId) {
  const block = await AvailabilityBlock.findOne({ where: { id: blockId, tenantId } });
  if (!block) {
    throw new AppError(404, "BLOCK_NOT_FOUND", "Bloqueio não encontrado para este tenant.");
  }
  await block.destroy();
}

async function listAvailabilityBlocks(tenantId, { from, to } = {}) {
  const where = { tenantId };
  if (from || to) {
    where.startsAt = {};
    if (from) where.startsAt[Op.gte] = new Date(from);
    if (to) where.startsAt[Op.lte] = new Date(to);
  }
  return AvailabilityBlock.findAll({ where, order: [["startsAt", "ASC"]] });
}

module.exports = {
  createAppointment,
  listAppointments,
  cancelAppointment,
  cancelAppointmentByToken,
  confirmPresenceByToken,
  deleteAppointmentPermanently,
  updateAppointmentStatus,
  createAvailabilityBlock,
  updateAvailabilityBlock,
  deleteAvailabilityBlock,
  listAvailabilityBlocks,
};
