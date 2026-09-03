import { X } from "lucide-react";

export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-(--color-surface) rounded-3xl w-full max-w-md p-6 border border-(--color-line) shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-(--color-ink)">{title}</h2>
          <button
            onClick={onClose}
            className="text-(--color-ink-soft) hover:text-(--color-ink) w-7 h-7 flex items-center justify-center rounded-full hover:bg-(--color-canvas)"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
