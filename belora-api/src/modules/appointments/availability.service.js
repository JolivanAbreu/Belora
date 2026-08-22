const { Op } = require("sequelize");
const { fromZonedTime } = require("date-fns-tz");
const { Appointment, AvailabilityBlock, Service, Tenant } = require("../../models");
const { AppError } = require("../../middlewares/errorHandler");

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const SLOT_GRANULARITY_MIN = 15; // granularidade dos horários candidatos exibidos ao cliente

/**
 * Calcula os horários disponíveis para um serviço, em uma data específica,
 * para um tenant.
 *
 * ESTA É A FONTE ÚNICA DA VERDADE sobre disponibilidade (ver Referência de
 * API, seção 5, e Arquitetura, seção 5): tanto o painel admin quanto a
 * booking page pública chamam esta mesma função, nunca reimplementam a
 * lógica de disponibilidade separadamente no frontend.
 *
 * Fuso horário: `date` é sempre um dia de calendário LOCAL do tenant (ex.:
 * "2026-08-24"), e os horários em `tenant.businessHours` também são hora
 * local. Toda conversão para instante UTC (o que fica de fato gravado e
 * comparado no banco) passa por `fromZonedTime`, usando `tenant.timezone`.
 */
async function getAvailableSlots({ tenantId, serviceId, date }) {
  const service = await Service.findOne({ where: { id: serviceId, tenantId, active: true } });
  if (!service) {
    throw new AppError(404, "SERVICE_NOT_FOUND", "Serviço não encontrado para este tenant.");
  }

  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw new AppError(404, "TENANT_NOT_FOUND", "Tenant não encontrado.");
  }

  const tz = tenant.timezone;

  // Dia de calendário local do tenant, expresso como instantes UTC (para
  // comparar com starts_at/ends_at gravados no banco, que são sempre UTC).
  const dayStart = fromZonedTime(`${date}T00:00:00`, tz);
  const dayEnd = fromZonedTime(`${date}T23:59:59.999`, tz);

  // Dia da semana é um fato de calendário puro (não depende de timezone):
  // extraído diretamente dos componentes Y-M-D da string `date`.
  const [year, month, day] = date.split("-").map(Number);
  const weekdayKey = WEEKDAY_KEYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const ranges = tenant.businessHours?.[weekdayKey] || [];

  if (ranges.length === 0) {
    return []; // tenant fechado nesse dia da semana
  }

  const [existingAppointments, blocks] = await Promise.all([
    Appointment.findAll({
      where: {
        tenantId,
        status: "confirmado",
        startsAt: { [Op.lt]: dayEnd },
        endsAt: { [Op.gt]: dayStart },
      },
    }),
    AvailabilityBlock.findAll({
      where: {
        tenantId,
        startsAt: { [Op.lt]: dayEnd },
        endsAt: { [Op.gt]: dayStart },
      },
    }),
  ]);

  const busyIntervals = [
    ...existingAppointments.map((a) => [a.startsAt, a.endsAt]),
    ...blocks.map((b) => [b.startsAt, b.endsAt]),
  ];

  const durationMs = service.durationMin * 60 * 1000;
  const slots = [];

  for (const [rangeStartStr, rangeEndStr] of ranges) {
    let cursor = fromZonedTime(`${date}T${rangeStartStr}:00`, tz);
    const rangeEnd = fromZonedTime(`${date}T${rangeEndStr}:00`, tz);

    while (cursor.getTime() + durationMs <= rangeEnd.getTime()) {
      const slotStart = cursor;
      const slotEnd = new Date(cursor.getTime() + durationMs);

      const overlaps = busyIntervals.some(([busyStart, busyEnd]) => overlapsInterval(slotStart, slotEnd, busyStart, busyEnd));

      if (!overlaps) {
        slots.push({ startsAt: slotStart.toISOString(), endsAt: slotEnd.toISOString() });
      }

      cursor = new Date(cursor.getTime() + SLOT_GRANULARITY_MIN * 60 * 1000);
    }
  }

  return slots;
}

function overlapsInterval(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

module.exports = { getAvailableSlots, overlapsInterval };
