export default function NotFound() {
  return (
    <div className="min-h-screen bg-(--color-canvas) flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="font-display italic text-3xl text-(--color-ink) mb-3">Belora</h1>
        <p className="text-sm text-(--color-ink-soft)">
          Não encontramos essa página de agendamento. Confira o link e tente novamente.
        </p>
      </div>
    </div>
  );
}
