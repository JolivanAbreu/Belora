import { useEffect, useMemo, useState, useCallback } from "react";
import { fromZonedTime } from "date-fns-tz";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toDateParam, formatDayLabel, formatTime, minutesSinceLocalMidnight, shiftDay, isToday } from "../lib/format";
import AppointmentCard from "../components/AppointmentCard";
import NewAppointmentModal from "../components/NewAppointmentModal";
import BlockTimeModal from "../components/BlockTimeModal";
import { IconChevronLeft, IconChevronRight, IconPlus, IconBlock } from "../components/icons";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const PX_PER_MINUTE = 1.05;

export default function Agenda() {
  const { tenant } = useAuth();
  const timezone = tenant?.timezone || "America/Fortaleza";
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showBlockTime, setShowBlockTime] = useState(false);

  const dateParam = toDateParam(date);

  const dayRanges = useMemo(() => {
    const key = WEEKDAY_KEYS[date.getDay()];
    return tenant?.businessHours?.[key] || [];
  }, [tenant, date]);

  const { dayStartMin, dayEndMin } = useMemo(() => {
    if (dayRanges.length === 0) return { dayStartMin: 8 * 60, dayEndMin: 19 * 60 };
    const starts = dayRanges.map(([s]) => toMinutes(s));
    const ends = dayRanges.map(([, e]) => toMinutes(e));
    return { dayStartMin: Math.min(...starts), dayEndMin: Math.max(...ends) };
  }, [dayRanges]);

  const load = useCallback(async () => {
    setLoading(true);
    // Limites do dia LOCAL do tenant, convertidos para instantes UTC - não o
    // dia UTC "puro" (que começaria/terminaria 3h mais cedo em Fortaleza).
    const from = fromZonedTime(`${dateParam}T00:00:00`, timezone).toISOString();
    const to = fromZonedTime(`${dateParam}T23:59:59.999`, timezone).toISOString();
    const [apptsRes, blocksRes, servicesRes] = await Promise.all([
      api.get("/appointments", { params: { from, to } }),
      api.get("/availability-blocks", { params: { from, to } }),
      api.get("/services"),
    ]);
    setAppointments(apptsRes.data);
    setBlocks(blocksRes.data);
    setServices(servicesRes.data.filter((s) => s.active));
    setLoading(false);
  }, [dateParam, timezone]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCancel(id) {
    await api.delete(`/appointments/${id}`);
    load();
  }

  const totalHeight = (dayEndMin - dayStartMin) * PX_PER_MINUTE;
  const hourMarks = buildHourMarks(dayStartMin, dayEndMin);

  return (
    <div className="p-8 max-w-4xl">
      <header className="flex items-center justify-between mb-7">
        <div>
          <h1 className="font-display text-2xl text-(--color-ink)">{formatDayLabel(date)}</h1>
          {isToday(date) && (
            <span className="text-xs text-(--color-clay-dark) font-medium">Hoje</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate((d) => shiftDay(d, -1))}
            className="w-9 h-9 rounded-full border border-(--color-line) flex items-center justify-center text-(--color-ink-soft) hover:bg-(--color-surface)"
            aria-label="Dia anterior"
          >
            <IconChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDate(new Date())}
            className="text-xs text-(--color-ink-soft) hover:text-(--color-ink) px-2"
          >
            Hoje
          </button>
          <button
            onClick={() => setDate((d) => shiftDay(d, 1))}
            className="w-9 h-9 rounded-full border border-(--color-line) flex items-center justify-center text-(--color-ink-soft) hover:bg-(--color-surface)"
            aria-label="Próximo dia"
          >
            <IconChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowNewAppointment(true)}
          disabled={services.length === 0}
          className="flex items-center gap-2 rounded-lg bg-(--color-ink) text-white text-sm font-medium px-4 py-2.5 hover:bg-(--color-ink)/90 transition-colors disabled:opacity-50"
        >
          <IconPlus className="w-4 h-4" />
          Novo agendamento
        </button>
        <button
          onClick={() => setShowBlockTime(true)}
          className="flex items-center gap-2 rounded-lg border border-(--color-line) text-(--color-ink) text-sm font-medium px-4 py-2.5 hover:bg-(--color-surface) transition-colors"
        >
          <IconBlock className="w-4 h-4" />
          Bloquear horário
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-(--color-ink-soft)">Carregando agenda...</p>
      ) : dayRanges.length === 0 ? (
        <div className="rounded-xl border border-dashed border-(--color-line) py-16 text-center text-(--color-ink-soft) text-sm">
          Fechado neste dia da semana.
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Régua de horas — elemento de assinatura da agenda */}
          <div className="relative w-14 shrink-0 text-right" style={{ height: totalHeight }}>
            {hourMarks.map((m) => (
              <span
                key={m}
                className="absolute -translate-y-1/2 text-[11px] text-(--color-ink-soft)/70 pr-2"
                style={{ top: (m - dayStartMin) * PX_PER_MINUTE }}
              >
                {String(Math.floor(m / 60)).padStart(2, "0")}h
              </span>
            ))}
          </div>

          <div className="relative flex-1 border-l border-(--color-line)" style={{ height: totalHeight }}>
            {hourMarks.map((m) => (
              <div
                key={m}
                className="absolute left-0 right-0 border-t border-(--color-line)/70"
                style={{ top: (m - dayStartMin) * PX_PER_MINUTE }}
              />
            ))}

            {blocks.map((block) => (
              <div
                key={block.id}
                className="absolute left-2 right-2 rounded-lg bg-[repeating-linear-gradient(135deg,rgba(46,26,71,0.06),rgba(46,26,71,0.06)_6px,transparent_6px,transparent_12px)] border border-(--color-line) flex items-center px-3"
                style={positionStyle(block.startsAt, block.endsAt, dateParam, dayStartMin, timezone)}
              >
                <span className="text-xs text-(--color-ink-soft)">
                  {block.reason || "Bloqueado"} · {formatTime(block.startsAt, timezone)}–{formatTime(block.endsAt, timezone)}
                </span>
              </div>
            ))}

            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="absolute left-2 right-2"
                style={positionStyle(appt.startsAt, appt.endsAt, dateParam, dayStartMin, timezone)}
              >
                <AppointmentCard appointment={appt} onCancel={handleCancel} timezone={timezone} />
              </div>
            ))}
          </div>
        </div>
      )}

      {showNewAppointment && (
        <NewAppointmentModal
          date={dateParam}
          services={services}
          onClose={() => setShowNewAppointment(false)}
          onCreated={() => {
            setShowNewAppointment(false);
            load();
          }}
        />
      )}

      {showBlockTime && (
        <BlockTimeModal
          date={dateParam}
          onClose={() => setShowBlockTime(false)}
          onCreated={() => {
            setShowBlockTime(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function buildHourMarks(startMin, endMin) {
  const marks = [];
  const firstHour = Math.ceil(startMin / 60) * 60;
  for (let m = firstHour; m <= endMin; m += 60) marks.push(m);
  return marks;
}

function positionStyle(startsAtIso, endsAtIso, dateParam, dayStartMin, timezone) {
  const startMin = minutesSinceLocalMidnight(startsAtIso, dateParam, timezone);
  const endMin = minutesSinceLocalMidnight(endsAtIso, dateParam, timezone);
  const top = (startMin - dayStartMin) * PX_PER_MINUTE;
  const height = Math.max((endMin - startMin) * PX_PER_MINUTE, 40);
  return { top, height };
}
