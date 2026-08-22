const steps = [
  { key: "service", label: "Serviço" },
  { key: "datetime", label: "Horário" },
  { key: "details", label: "Seus dados" },
];

export default function ProgressSteps({ current }) {
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <span
              className={`w-6 h-6 rounded-full text-[11px] flex items-center justify-center font-medium shrink-0 transition-colors ${
                i <= currentIndex
                  ? "bg-(--color-ink) text-white"
                  : "bg-(--color-line) text-(--color-ink-soft)"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-xs hidden sm:inline ${
                i <= currentIndex ? "text-(--color-ink)" : "text-(--color-ink-soft)"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px flex-1 ${i < currentIndex ? "bg-(--color-ink)" : "bg-(--color-line)"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
