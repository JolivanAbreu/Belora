import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export function toDateParam(date) {
  return format(date, "yyyy-MM-dd");
}

export function formatDayLabel(date) {
  const label = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Formata no fuso do tenant, não no fuso do navegador.
export function formatTime(isoString, timezone) {
  return formatInTimeZone(isoString, timezone, "HH:mm");
}

// Minutos desde a meia-noite local do tenant.
export function minutesSinceLocalMidnight(isoString, dateParam, timezone) {
  const localMidnightUtc = fromZonedTime(`${dateParam}T00:00:00`, timezone);
  return (new Date(isoString).getTime() - localMidnightUtc.getTime()) / 60000;
}

export function shiftDay(date, amount) {
  return addDays(date, amount);
}

export function isToday(date) {
  return toDateParam(date) === toDateParam(new Date());
}
