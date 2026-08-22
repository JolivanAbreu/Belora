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

// Formata um instante ISO (sempre UTC, vindo da API) no fuso horário do
// tenant - nunca no fuso do navegador de quem está olhando a tela, já que
// admin e cliente podem estar em qualquer lugar (ver correção de fuso
// horário no backend, availability.service.js).
export function formatTime(isoString, timezone) {
  return formatInTimeZone(isoString, timezone, "HH:mm");
}

// Converte um instante ISO (UTC) para minutos desde a meia-noite LOCAL do
// tenant - usado para posicionar cards na régua de horários da Agenda.
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
