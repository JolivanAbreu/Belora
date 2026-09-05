const cron = require("node-cron");
const { Op } = require("sequelize");
const { Appointment, Client, Service, Tenant, NotificationLog } = require("../models");
const notificationsService = require("../modules/notifications/notifications.service");

const SWEEP_INTERVAL_MINUTES = 15;

// O campo "type" evita reenviar o mesmo lembrete duas vezes.
const REMINDER_WINDOWS = [
  { type: "reminder_24h", hoursBefore: 24 },
  { type: "reminder_2h", hoursBefore: 2 },
  { type: "reminder_30min", hoursBefore: 0.5 },
];

// A condição é "antecedência já atingida e lembrete ainda não enviado",
// não uma janela fixa de minutos. Assim, se o servidor ficar fora do ar no
// momento exato, a próxima varredura ainda envia o lembrete pendente.
async function runReminderSweep(now = new Date()) {
  const results = [];

  for (const window of REMINDER_WINDOWS) {
    const threshold = new Date(now.getTime() + window.hoursBefore * 60 * 60 * 1000);

    const candidates = await Appointment.findAll({
      where: {
        status: "confirmado",
        startsAt: { [Op.gt]: now, [Op.lte]: threshold },
      },
      include: [Client, Service, Tenant],
    });

    for (const appointment of candidates) {
      const alreadySent = await NotificationLog.findOne({
        where: { appointmentId: appointment.id, type: window.type },
      });
      if (alreadySent) continue;

      const result = await notificationsService.sendAndLog(appointment, window.type);
      results.push({ appointmentId: appointment.id, type: window.type, ok: result.ok });
    }
  }

  return results;
}

// Chamado por server.js, nunca por app.js: os testes importam app.js
// diretamente e não devem disparar crons.
function scheduleReminders() {
  cron.schedule(`*/${SWEEP_INTERVAL_MINUTES} * * * *`, () => {
    runReminderSweep().catch((err) => console.error("Erro na varredura de lembretes:", err));
  });
  console.log(`Lembretes automáticos agendados (a cada ${SWEEP_INTERVAL_MINUTES} min).`);
}

module.exports = { runReminderSweep, scheduleReminders };
