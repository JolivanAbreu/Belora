const { Op } = require("sequelize");
const { fromZonedTime, formatInTimeZone } = require("date-fns-tz");
const { Appointment, Service, Tenant } = require("../../models");

// Usa aritmética inteira de ano/mês. Reconstruir um Date a partir de
// componentes locais e reformatar em outro fuso desalinha o mês na virada.
function lastMonthKeys(count, timezone) {
  const [currentYear, currentMonth] = formatInTimeZone(new Date(), timezone, "yyyy-MM")
    .split("-")
    .map(Number);

  const keys = [];
  for (let i = count - 1; i >= 0; i--) {
    const totalMonths = currentYear * 12 + (currentMonth - 1) - i;
    const year = Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    keys.push(`${year}-${String(month).padStart(2, "0")}`);
  }
  return keys;
}

// Faturamento considera apenas agendamentos concluídos.
// Taxa de falta = nao_compareceu / (concluido + nao_compareceu):
// cancelamentos com antecedência não entram na conta.
async function getMonthlySummary(tenantId, months = 6) {
  const tenant = await Tenant.findByPk(tenantId);
  const timezone = tenant?.timezone || "America/Fortaleza";

  const monthKeys = lastMonthKeys(months, timezone);
  const oldestMonth = monthKeys[0];
  const rangeStart = fromZonedTime(`${oldestMonth}-01T00:00:00`, timezone);

  const appointments = await Appointment.findAll({
    where: {
      tenantId,
      startsAt: { [Op.gte]: rangeStart },
      status: { [Op.in]: ["concluido", "nao_compareceu"] },
    },
    include: [Service],
  });

  const byMonth = Object.fromEntries(
    monthKeys.map((key) => [key, { month: key, revenue: 0, completed: 0, noShow: 0 }])
  );

  for (const appt of appointments) {
    const key = formatInTimeZone(appt.startsAt, timezone, "yyyy-MM");
    if (!byMonth[key]) continue;

    if (appt.status === "concluido") {
      byMonth[key].completed += 1;
      byMonth[key].revenue += Number(appt.Service?.price || 0);
    } else if (appt.status === "nao_compareceu") {
      byMonth[key].noShow += 1;
    }
  }

  const monthly = monthKeys.map((key) => {
    const entry = byMonth[key];
    const totalRelevant = entry.completed + entry.noShow;
    const noShowRate = totalRelevant > 0 ? Math.round((entry.noShow / totalRelevant) * 1000) / 10 : null;
    return { ...entry, noShowRate };
  });

  return { months: monthly };
}

// Ranking por faturamento, considerando apenas agendamentos concluídos.
async function getTopServices(tenantId, months = 6) {
  const tenant = await Tenant.findByPk(tenantId);
  const timezone = tenant?.timezone || "America/Fortaleza";

  const monthKeys = lastMonthKeys(months, timezone);
  const rangeStart = fromZonedTime(`${monthKeys[0]}-01T00:00:00`, timezone);

  const appointments = await Appointment.findAll({
    where: {
      tenantId,
      startsAt: { [Op.gte]: rangeStart },
      status: "concluido",
    },
    include: [Service],
  });

  const byService = new Map();
  for (const appt of appointments) {
    if (!appt.Service) continue;
    const key = appt.Service.id;
    const existing = byService.get(key) || { serviceId: key, name: appt.Service.name, count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += Number(appt.Service.price);
    byService.set(key, existing);
  }

  return [...byService.values()].sort((a, b) => b.revenue - a.revenue);
}

module.exports = { getMonthlySummary, getTopServices };
