import { useEffect, useState } from "react";
import { Calendar, DollarSign, Users, PieChart, Clock, ArrowRight, ListTodo, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toDateParam, formatTime } from "../lib/format";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function Dashboard() {
  const { tenant } = useAuth();
  const timezone = tenant?.timezone || "America/Fortaleza";
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const todayParam = toDateParam(new Date());
      const [apptsRes, clientsRes, notificationsRes] = await Promise.all([
        api.get("/appointments", {
          params: { from: `${todayParam}T00:00:00.000Z`, to: `${todayParam}T23:59:59.999Z` },
        }),
        api.get("/clients"),
        api.get("/notifications-log"),
      ]);
      setTodayAppointments(apptsRes.data.filter((a) => a.status === "confirmado"));
      setClientsCount(clientsRes.data.length);
      setRecentNotifications(notificationsRes.data.slice(0, 3));
      setLoading(false);
    }
    load();
  }, []);

  const estimatedRevenue = todayAppointments.reduce(
    (sum, a) => sum + Number(a.Service?.price || 0),
    0
  );

  // Minutos agendados sobre o total de minutos de expediente do dia.
  const todayKey = WEEKDAY_KEYS[new Date().getDay()];
  const todayRanges = tenant?.businessHours?.[todayKey] || [];
  const availableMinutes = todayRanges.reduce((sum, [start, end]) => {
    return sum + (toMinutes(end) - toMinutes(start));
  }, 0);
  const bookedMinutes = todayAppointments.reduce((sum, a) => sum + (a.Service?.durationMin || 0), 0);
  const occupancyRate = availableMinutes > 0 ? Math.round((bookedMinutes / availableMinutes) * 100) : 0;

  const metrics = [
    { label: "Agendamentos Hoje", value: loading ? "…" : todayAppointments.length, Icon: Calendar },
    {
      label: "Estimativa de Faturamento",
      value: loading ? "…" : `R$ ${estimatedRevenue.toFixed(2)}`,
      Icon: DollarSign,
    },
    {
      label: "Taxa de Ocupação",
      value: loading ? "…" : availableMinutes === 0 ? "Fechado" : `${occupancyRate}%`,
      Icon: PieChart,
    },
    { label: "Clientes Cadastradas", value: loading ? "…" : clientsCount, Icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur p-5 rounded-3xl border border-(--color-line) shadow-sm">
        <div>
          <h2 className="text-2xl font-display font-bold text-(--color-ink)">
            Visão Geral do Estabelecimento
          </h2>
          <p className="text-xs sm:text-sm text-(--color-ink-soft)">
            Métricas do dia de hoje, {tenant?.name}
          </p>
        </div>
        <Link
          to="/agenda"
          className="px-4 py-2 bg-(--color-ink) text-white rounded-2xl text-xs font-semibold hover:bg-(--color-clay-dark) transition-all flex items-center gap-1.5 shadow"
        >
          <Calendar className="w-4 h-4" /> Ir para Agenda
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="bg-white/90 p-5 rounded-3xl border border-(--color-line) shadow-sm"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-(--color-ink-soft) uppercase tracking-wider">
                {label}
              </span>
              <div className="p-2.5 bg-(--color-lilac-soft) rounded-2xl text-(--color-ink) border border-(--color-line)">
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-(--color-ink) mt-3">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/90 backdrop-blur rounded-3xl p-5 sm:p-6 border border-(--color-line) shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-(--color-line) pb-3">
            <h3 className="font-display font-bold text-lg text-(--color-ink) flex items-center gap-2">
              <ListTodo className="w-5 h-5" />
              Atendimentos de Hoje
            </h3>
            <Link
              to="/agenda"
              className="text-xs font-semibold text-(--color-ink) hover:underline flex items-center gap-1"
            >
              Ver na Agenda Completa <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-(--color-ink-soft)">Carregando...</p>
          ) : todayAppointments.length === 0 ? (
            <p className="text-sm text-(--color-ink-soft)">Nenhum atendimento confirmado para hoje.</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl bg-(--color-lilac-soft) border border-(--color-line)"
                >
                  <div>
                    <p className="text-sm font-semibold text-(--color-ink)">{appt.Client?.name}</p>
                    <p className="text-xs text-(--color-ink-soft)">{appt.Service?.name}</p>
                  </div>
                  <span className="text-xs font-semibold text-(--color-ink) flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(appt.startsAt, timezone)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/90 backdrop-blur rounded-3xl p-5 sm:p-6 border border-(--color-line) shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-(--color-line) pb-3">
            <h3 className="font-display font-bold text-lg text-(--color-ink) flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </h3>
            <Link to="/notificacoes" className="text-xs font-semibold text-(--color-ink) hover:underline">
              Ver todas
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-(--color-ink-soft)">Carregando...</p>
          ) : recentNotifications.length === 0 ? (
            <p className="text-sm text-(--color-ink-soft)">
              Nenhuma notificação enviada ainda.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentNotifications.map((log) => (
                <div key={log.id} className="px-3.5 py-2.5 rounded-xl bg-(--color-lilac-soft) border border-(--color-line) text-xs">
                  <p className="font-medium text-(--color-ink)">{log.Appointment?.Client?.name || "Cliente"}</p>
                  <p className="text-(--color-ink-soft)">{formatTime(log.sentAt, timezone)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
