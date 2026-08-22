import { formatTime } from "../lib/format";

export default function TimeSlotGrid({ slots, selectedSlot, onSelect, loading, timezone }) {
  if (loading) {
    return <p className="text-sm text-(--color-ink-soft) py-8 text-center">Buscando horários...</p>;
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-(--color-ink-soft) py-8 text-center">
        Nenhum horário disponível neste dia. Tente outra data.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected = selectedSlot?.startsAt === slot.startsAt;
        return (
          <button
            key={slot.startsAt}
            onClick={() => onSelect(slot)}
            className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
              isSelected
                ? "bg-(--color-ink) border-(--color-ink) text-white"
                : "bg-(--color-surface) border-(--color-line) text-(--color-ink) hover:border-(--color-clay)"
            }`}
          >
            {formatTime(slot.startsAt, timezone)}
          </button>
        );
      })}
    </div>
  );
}
