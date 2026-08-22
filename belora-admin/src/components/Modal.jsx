export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-(--color-ink)/25 backdrop-blur-[2px] flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-(--color-surface) rounded-2xl w-full max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-(--color-ink)">{title}</h2>
          <button
            onClick={onClose}
            className="text-(--color-ink-soft) hover:text-(--color-ink) text-lg leading-none w-7 h-7 flex items-center justify-center rounded-full hover:bg-(--color-canvas)"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
