import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { confirmPresence } from "../lib/api";
import NotFound from "./NotFound";

export default function ConfirmPresence() {
  const { slug, appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("confirm"); // confirm | sending | done | error
  const [errorMessage, setErrorMessage] = useState("");

  if (!token) return <NotFound />;

  async function handleConfirm() {
    setStatus("sending");
    try {
      await confirmPresence(slug, appointmentId, token);
      setStatus("done");
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === "ALREADY_CANCELLED") {
        setErrorMessage("Este agendamento já foi cancelado, não é possível confirmar presença.");
      } else if (code === "INVALID_CANCELLATION_TOKEN" || code === "APPOINTMENT_NOT_FOUND") {
        setErrorMessage("Não encontramos esse agendamento. Confira o link recebido no WhatsApp.");
      } else {
        setErrorMessage("Não foi possível confirmar agora. Tente novamente em instantes.");
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
              <h2 className="font-display text-xl text-(--color-ink) mb-2">Confirmar presença</h2>
              <p className="text-sm text-(--color-ink-soft) mb-6">
                Seu horário está chegando! Confirme que você vai comparecer.
              </p>
              <button
                onClick={handleConfirm}
                className="w-full rounded-xl bg-(--color-ink) text-white text-sm font-semibold py-3 hover:bg-(--color-clay-dark) transition-colors"
              >
                Sim, vou comparecer
              </button>
            </>
          )}

          {status === "sending" && (
            <p className="text-sm text-(--color-ink-soft) py-4">Confirmando...</p>
          )}

          {status === "done" && (
            <>
              <div className="w-14 h-14 rounded-full bg-(--color-lilac-soft) text-(--color-ink) flex items-center justify-center text-2xl mx-auto mb-4">
                ✓
              </div>
              <h2 className="font-display text-xl text-(--color-ink) mb-2">Presença confirmada</h2>
              <p className="text-sm text-(--color-ink-soft)">Te esperamos! Até já.</p>
            </>
          )}

          {status === "error" && (
            <>
              <h2 className="font-display text-xl text-(--color-ink) mb-2">Não foi possível confirmar</h2>
              <p className="text-sm text-(--color-ink-soft)">{errorMessage}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
