import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { cancelAppointment } from "../lib/api";
import NotFound from "./NotFound";

export default function CancelAppointment() {
  const { slug, appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("confirm"); // confirm | cancelling | done | error
  const [errorMessage, setErrorMessage] = useState("");

  if (!token) return <NotFound />;

  async function handleConfirmCancel() {
    setStatus("cancelling");
    try {
      await cancelAppointment(slug, appointmentId, token);
      setStatus("done");
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === "ALREADY_CANCELLED") {
        setErrorMessage("Este agendamento já havia sido cancelado anteriormente.");
      } else if (code === "INVALID_CANCELLATION_TOKEN" || code === "APPOINTMENT_NOT_FOUND") {
        setErrorMessage("Não encontramos esse agendamento. Confira o link recebido no WhatsApp.");
      } else {
        setErrorMessage("Não foi possível cancelar agora. Tente novamente em instantes.");
      }
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-(--color-canvas) flex justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="font-display italic text-3xl text-(--color-ink)">Belora</h1>
        </header>

        <div className="bg-(--color-surface) rounded-3xl border border-(--color-line) shadow-sm p-6 text-center">
          {status === "confirm" && (
            <>
              <h2 className="font-display text-xl text-(--color-ink) mb-2">
                Cancelar agendamento
              </h2>
              <p className="text-sm text-(--color-ink-soft) mb-6">
                Tem certeza que deseja cancelar este agendamento? Essa ação não pode ser desfeita.
              </p>
              <button
                onClick={handleConfirmCancel}
                className="w-full rounded-xl bg-(--color-ink) text-white text-sm font-semibold py-3 hover:bg-(--color-clay-dark) transition-colors"
              >
                Sim, cancelar agendamento
              </button>
            </>
          )}

          {status === "cancelling" && (
            <p className="text-sm text-(--color-ink-soft) py-4">Cancelando...</p>
          )}

          {status === "done" && (
            <>
              <div className="w-14 h-14 rounded-full bg-(--color-lilac-soft) text-(--color-ink) flex items-center justify-center text-2xl mx-auto mb-4">
                ✓
              </div>
              <h2 className="font-display text-xl text-(--color-ink) mb-2">
                Agendamento cancelado
              </h2>
              <p className="text-sm text-(--color-ink-soft)">
                Se quiser marcar um novo horário, é só acessar o link de agendamento novamente.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <h2 className="font-display text-xl text-(--color-ink) mb-2">Não foi possível cancelar</h2>
              <p className="text-sm text-(--color-ink-soft)">{errorMessage}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
