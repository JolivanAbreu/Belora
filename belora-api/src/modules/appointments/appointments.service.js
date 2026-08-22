const { Op } = require("sequelize");
const { fromZonedTime } = require("date-fns-tz");
const { sequelize, Appointment, AvailabilityBlock, Service, Client, Tenant } = require("../../models");
const { AppError } = require("../../middlewares/errorHandler");

/**
 * Interpreta uma string de data/hora recebida da API.
 *
 * Duas origens possíveis:
 * - Vem da booking page pública, ecoando de volta um horário já calculado
 *   por availability.service (sempre um instante UTC absoluto, terminado em
 *   "Z") - nesse caso não há ambiguidade, é só um Date direto.
 * - Vem do painel admin (criação manual de agendamento/bloqueio), como hora
 *   LOCAL do tenant, sem "Z" (ex.: "2026-08-24T13:00:00") - precisa ser
 *   convertida para instante UTC usando o fuso do tenant.
 *
 * Ver Documento de Arquitetura / correção de fuso horário.
 */
function parseTenantDateTime(value, timezone) {
  if (!value || typeof value !== "string") {
    throw new Error("invalid datetime");
  }
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(value)) {
    return new Date(value); // já é um instante absoluto (UTC ou com offset explícito)
  }
  return fromZonedTime(value, timezone);
}

/**
 * Cria um agendamento garantindo ausência de conflito de horário, mesmo sob
 * concorrência (duas pessoas tentando marcar o mesmo horário ao mesmo tempo -
 * ver TC-10 do Plano de Testes).
 *
 * Estratégia: advisory lock do Postgres por tenantId dentro da transação.
 * Isso serializa a criação de agendamentos de um MESMO tenant sem travar
 * tenants diferentes entre si (o lock é tomado por hash do tenantId).
 *
 * @param {string} tenantId - SEMPRE resolvido pelo middleware de auth/tenant, nunca recebido do client.
 * @param {object} input - { serviceId, startsAt, clientId? , client?: { name, phone } }
 */
async function createAppointment(tenantId, input) {
  return sequelize.transaction(async (t) => {
    // Serializa criação de agendamentos deste tenant durante a transação
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

    const appointment = await Appointment.create({
      tenantId,
      clientId: client.id,
      serviceId: service.id,
      startsAt,
      endsAt,
      status: "confirmado",
    }, { transaction: t });

    return appointment;
  });
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
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  listAvailabilityBlocks,
};
