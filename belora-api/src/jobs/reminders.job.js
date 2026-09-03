const cron = require("node-cron");
const { Op } = require("sequelize");
const { Appointment, Client, Service, Tenant, NotificationLog } = require("../models");
const notificationsService = require("../modules/notifications/notifications.service");

const SWEEP_INTERVAL_MINUTES = 15;

// Cada janela define quanto tempo antes do agendamento o lembrete deve
// sair, e o "type" usado para não reenviar o mesmo lembrete duas vezes
// (ver NotificationLog.type e o índice único lógico por appointment+type).
const REMINDER_WINDOWS = [
  { type: "reminder_24h", hoursBefore: 24 },
  { type: "reminder_2h", hoursBefore: 2 },
  { type: "reminder_30min", hoursBefore: 0.5 },
];

/**
 * Varre os agendamentos confirmados e envia o lembrete correspondente para
 * qualquer um que já tenha entrado na janela de antecedência (24h, 2h ou
 * 30min) e ainda não tenha recebido aquele lembrete específico.
 *
 * Ao contrário de uma janela fixa de alguns minutos, a condição aqui é
 * "startsAt já está dentro da antecedência E o agendamento ainda não
 * aconteceu E esse tipo de lembrete ainda não foi enviado" - isso faz a
 * varredura se auto-recuperar de indisponibilidade do servidor: se a API
 * ficar fora do ar durante o momento exato em que um lembrete deveria sair,
 * a próxima varredura que rodar (mesmo horas depois, contanto que o
 * agendamento ainda não tenha ocorrido) ainda vai enviá-lo, em vez de
 * simplesmente pular aquele lembrete para sempre.
 */
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

/**
 * Agenda a varredura para rodar automaticamente a cada
 * SWEEP_INTERVAL_MINUTES minutos. Chamado a partir de server.js - nunca a
 * partir de app.js, para não disparar crons durante os testes automatizados
 * (que importam app.js diretamente via supertest).
 */
function scheduleReminders() {
  cron.schedule(`*/${SWEEP_INTERVAL_MINUTES} * * * *`, () => {
    runReminderSweep().catch((err) => console.error("Erro na varredura de lembretes:", err));
  });
  console.log(`Lembretes automáticos agendados (a cada ${SWEEP_INTERVAL_MINUTES} min).`);
}

module.exports = { runReminderSweep, scheduleReminders };
