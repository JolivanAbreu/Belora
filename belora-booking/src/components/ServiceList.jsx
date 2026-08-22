export default function ServiceList({ services, onSelect }) {
  if (services.length === 0) {
    return (
      <p className="text-sm text-(--color-ink-soft) text-center py-12">
        Nenhum serviço disponível para agendamento no momento.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => onSelect(service)}
          className="w-full text-left rounded-xl border border-(--color-line) bg-(--color-surface) px-5 py-4 flex items-center justify-between hover:border-(--color-clay) transition-colors group"
        >
          <div>
            <p className="text-sm font-medium text-(--color-ink)">{service.name}</p>
            <p className="text-xs text-(--color-ink-soft) mt-0.5">{service.durationMin} min</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-(--color-ink)">
              R$ {Number(service.price).toFixed(2)}
            </span>
            <span className="w-7 h-7 rounded-full border border-(--color-line) flex items-center justify-center text-(--color-ink-soft) group-hover:border-(--color-clay) group-hover:text-(--color-clay-dark) transition-colors">
              →
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
