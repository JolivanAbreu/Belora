import { useEffect, useState } from "react";
import { Bell, Info } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatTime } from "../lib/format";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const channelLabels = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  sms: "SMS",
};

const typeLabels = {
  confirmation: "Confirmação",
  reminder_24h: "Lembrete (24h antes)",
  reminder_2h: "Lembrete (2h antes)",
  reminder_30min: "Lembrete (30min antes)",
};

export default function Notificacoes() {
  const { tenant } = useAuth();
  const timezone = tenant?.timezone || "America/Fortaleza";
  const [logs, setLogs] = useState(null); // null = carregando

  useEffect(() => {
    api.get("/notifications-log").then((res) => setLogs(res.data));
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white/90 backdrop-blur p-5 rounded-3xl border border-(--color-line) shadow-sm">
        <h2 className="text-2xl font-display font-bold text-(--color-ink) flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificações enviadas
        </h2>
        <p className="text-xs sm:text-sm text-(--color-ink-soft)">
          Histórico de lembretes e confirmações enviados às clientes
        </p>
      </div>

      <div className="rounded-2xl bg-(--color-lilac-soft) border border-(--color-line) p-4 flex items-start gap-3 text-xs text-(--color-ink)">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          A lógica de confirmação e lembretes (24h, 2h e 30min antes, com link de
          confirmação de presença) já está implementada e rodando. Personalize o texto de
          cada mensagem na aba <strong>Configurações</strong>. Por padrão, o envio usa um
          provedor de teste que só registra a mensagem no log do servidor, sem mandar
          WhatsApp de verdade — para enviar de fato, configure{" "}
          <code>WHATSAPP_PROVIDER=evolution</code> e as credenciais da Evolution API no
          backend (ver README).
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-3xl p-5 sm:p-6 border border-(--color-line) shadow-sm">
        {logs === null ? (
          <p className="text-sm text-(--color-ink-soft)">Carregando...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-(--color-ink-soft)">Nenhuma notificação registrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <NotificationRow key={log.id} log={log} timezone={timezone} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationRow({ log, timezone }) {
  const appt = log.Appointment;
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-(--color-lilac-soft) border border-(--color-line)">
      <div>
        <p className="text-sm font-medium text-(--color-ink)">
          {appt?.Client?.name || "Cliente"} · {appt?.Service?.name || "Serviço"}
        </p>
        <p className="text-xs text-(--color-ink-soft)">
          {channelLabels[log.channel] || log.channel} · {formatLongDate(log.sentAt)} às{" "}
          {formatTime(log.sentAt, timezone)}
          {appt?.presenceConfirmedAt && " · Presença confirmada pela cliente"}
        </p>
      </div>
      <span className="text-[11px] uppercase tracking-wide text-(--color-ink-soft) font-semibold shrink-0 ml-3">
        {typeLabels[log.type] || log.type}
      </span>
    </div>
  );
}

function formatLongDate(iso) {
  return format(parseISO(iso), "d 'de' MMMM", { locale: ptBR });
}
