import { format, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

export function toDateParam(date) {
  return format(date, "yyyy-MM-dd");
}

export function nextDays(count) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => addDays(today, i));
}

export function formatWeekdayShort(date) {
  const label = format(date, "EEE", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

export function formatDayNumber(date) {
  return format(date, "d");
}

export function formatMonthShort(date) {
  const label = format(date, "MMM", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

export function formatFullDate(date) {
  const label = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Formata no fuso horário do TENANT, não no fuso de quem está com o celular
// na mão - importante porque um horário pode ser marcado por alguém em outra
// cidade/fuso para a pessoa que vai ao atendimento (ver correção de fuso
// horário no backend, availability.service.js).
export function formatTime(isoString, timezone) {
  return formatInTimeZone(isoString, timezone, "HH:mm");
}

export function isSameCalendarDay(a, b) {
  return isSameDay(a, b);
}
