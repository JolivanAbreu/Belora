import { useState } from "react";
import Modal from "./Modal";
import api from "../lib/api";

export default function BlockTimeModal({ date, onClose, onCreated }) {
  const [from, setFrom] = useState("12:00");
  const [to, setTo] = useState("13:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (from >= to) {
      setError("O horário final deve ser depois do horário inicial.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/availability-blocks", {
        // Hora LOCAL do tenant, sem "Z" - mesma convenção do NewAppointmentModal.
        startsAt: `${date}T${from}:00`,
        endsAt: `${date}T${to}:00`,
        reason: reason || undefined,
      });
      onCreated();
    } catch {
      setError("Não foi possível criar o bloqueio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Bloquear horário" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">De</label>
            <input
              type="time"
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">Até</label>
            <input
              type="time"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">
            Motivo <span className="text-(--color-ink-soft)/60">(opcional)</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Almoço, folga, imprevisto..."
            className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-(--color-ink) text-white text-sm font-medium py-2.5 hover:bg-(--color-ink)/90 transition-colors disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Bloquear horário"}
        </button>
      </form>
    </Modal>
  );
}
