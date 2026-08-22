import { nextDays, formatWeekdayShort, formatDayNumber, formatMonthShort, isSameCalendarDay } from "../lib/format";

export default function DateStrip({ selectedDate, onSelect }) {
  const days = nextDays(21);

  return (
    <div className="flex gap-2 overflow-x-auto thin-scroll pb-2 -mx-1 px-1">
      {days.map((day) => {
        const isSelected = isSameCalendarDay(day, selectedDate);
        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelect(day)}
            className={`shrink-0 w-16 rounded-xl border py-2.5 flex flex-col items-center transition-colors ${
              isSelected
                ? "bg-(--color-ink) border-(--color-ink) text-white"
                : "bg-(--color-surface) border-(--color-line) text-(--color-ink) hover:border-(--color-clay)"
            }`}
          >
            <span className={`text-[10px] uppercase tracking-wide ${isSelected ? "text-white/70" : "text-(--color-ink-soft)"}`}>
              {formatWeekdayShort(day)}
            </span>
            <span className="text-lg font-medium leading-tight">{formatDayNumber(day)}</span>
            <span className={`text-[10px] ${isSelected ? "text-white/70" : "text-(--color-ink-soft)"}`}>
              {formatMonthShort(day)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
