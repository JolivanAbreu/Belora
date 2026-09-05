const { Op } = require("sequelize");
const { fromZonedTime } = require("date-fns-tz");
const { Appointment, AvailabilityBlock, Service, Tenant } = require("../../models");
const { AppError } = require("../../middlewares/errorHandler");

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const SLOT_GRANULARITY_MIN = 15; // granularidade dos horários candidatos exibidos ao cliente

// Fonte única da verdade sobre disponibilidade: painel admin e booking page
// chamam esta mesma função.
//
// `date` e os horários em `tenant.businessHours` são sempre hora local do
// tenant; a conversão para instante UTC passa por fromZonedTime.
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

  // Dia local do tenant expresso em instantes UTC, para comparar com os
  // valores gravados no banco.
  const dayStart = fromZonedTime(`${date}T00:00:00`, tz);
  const dayEnd = fromZonedTime(`${date}T23:59:59.999`, tz);

  // Dia da semana não depende de fuso: vem direto dos componentes da data.
  const [year, month, day] = date.split("-").map(Number);
  const weekdayKey = WEEKDAY_KEYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const ranges = tenant.businessHours?.[weekdayKey] || [];

  if (ranges.length === 0) {
    return [];
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
