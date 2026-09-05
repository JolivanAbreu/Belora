import { useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import Modal from "./Modal";
import api from "../lib/api";

// Datas (yyyy-MM-dd) entre startDate e endDate, inclusive.
function eachDateInRange(startDate, endDate) {
  const dates = [];
  let cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return dates;
}

export default function BlockTimeModal({ date, block, timezone, onClose, onCreated }) {
  const isEditing = !!block;

  const [fromDate, setFromDate] = useState(date);
  const [toDate, setToDate] = useState(date);
  const [from, setFrom] = useState(
    isEditing ? formatInTimeZone(block.startsAt, timezone, "HH:mm") : "12:00"
  );
  const [to, setTo] = useState(
    isEditing ? formatInTimeZone(block.endsAt, timezone, "HH:mm") : "13:00"
  );
  const [reason, setReason] = useState(block?.reason || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (from >= to) {
      setError("O horário final deve ser depois do horário inicial.");
      return;
    }
    if (!isEditing && fromDate > toDate) {
      setError("A data final deve ser igual ou depois da data inicial.");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        // Reaproveita a data original do bloqueio, não o filtro da tela.
        const blockDate = formatInTimeZone(block.startsAt, timezone, "yyyy-MM-dd");
        await api.patch(`/availability-blocks/${block.id}`, {
          startsAt: `${blockDate}T${from}:00`,
          endsAt: `${blockDate}T${to}:00`,
          reason: reason || undefined,
        });
      } else {
        // Um bloqueio por dia no intervalo, em hora local do tenant.
        const dates = eachDateInRange(fromDate, toDate);
        await Promise.all(
          dates.map((d) =>
            api.post("/availability-blocks", {
              startsAt: `${d}T${from}:00`,
              endsAt: `${d}T${to}:00`,
              reason: reason || undefined,
            })
          )
        );
      }
      onCreated();
    } catch {
      setError(isEditing ? "Não foi possível salvar as alterações." : "Não foi possível criar o bloqueio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEditing ? "Editar bloqueio" : "Bloquear horário"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditing && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">
                Bloquear a partir de
              </label>
              <input
                type="date"
                required
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl bg-(--color-lilac-soft) border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">Até</label>
              <input
                type="date"
                required
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl bg-(--color-lilac-soft) border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
              />
            </div>
            {fromDate !== toDate && (
              <p className="col-span-2 text-[11px] text-(--color-ink-soft) -mt-1">
                Vai criar um bloqueio com o mesmo horário em cada dia desse período.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">
              Horário de {isEditing ? "" : "cada dia, "}de
            </label>
            <input
              type="time"
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl bg-(--color-lilac-soft) border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">Até</label>
            <input
              type="time"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl bg-(--color-lilac-soft) border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
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
            placeholder="Almoço, folga, imprevisto, férias..."
            className="w-full rounded-xl bg-(--color-lilac-soft) border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-(--color-ink) text-white text-sm font-medium py-2.5 hover:bg-(--color-ink)/90 transition-colors disabled:opacity-60"
        >
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Bloquear horário"}
        </button>
      </form>
    </Modal>
  );
}
