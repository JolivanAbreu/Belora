import { formatTime } from "../lib/format";

const statusStyles = {
  confirmado: "border-(--color-clay) bg-(--color-surface)",
  cancelado: "border-(--color-line) bg-(--color-canvas) opacity-55",
  concluido: "border-(--color-sage) bg-(--color-sage-soft)",
  nao_compareceu: "border-(--color-line) bg-(--color-canvas) opacity-70",
};

const statusLabels = {
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  concluido: "Concluído",
  nao_compareceu: "Não compareceu",
};

export default function AppointmentCard({ appointment, onCancel, timezone }) {
  const isCancelled = appointment.status === "cancelado";

  return (
    <div
      className={`rounded-xl border-l-4 ${statusStyles[appointment.status] || statusStyles.confirmado} border border-(--color-line) px-4 py-3 flex items-center justify-between gap-3`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-(--color-ink) truncate">
          {appointment.Client?.name || "Cliente"}
        </p>
        <p className="text-xs text-(--color-ink-soft) truncate">
          {appointment.Service?.name} · {formatTime(appointment.startsAt, timezone)}–{formatTime(appointment.endsAt, timezone)}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] uppercase tracking-wide text-(--color-ink-soft)">
          {statusLabels[appointment.status]}
        </span>
        {!isCancelled && appointment.status === "confirmado" && (
          <button
            onClick={() => onCancel(appointment.id)}
            className="text-xs text-(--color-clay-dark) hover:underline"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
