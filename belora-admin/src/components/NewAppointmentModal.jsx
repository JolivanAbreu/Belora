import { useState } from "react";
import Modal from "./Modal";
import api from "../lib/api";

export default function NewAppointmentModal({ date, services, onClose, onCreated }) {
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [time, setTime] = useState("09:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      // Hora LOCAL do tenant, sem "Z" - o backend interpreta usando
      // tenant.timezone (ver parseTenantDateTime em appointments.service.js).
      const startsAt = `${date}T${time}:00`;
      await api.post("/appointments", {
        serviceId,
        startsAt,
        client: { name, phone },
      });
      onCreated();
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === "SLOT_UNAVAILABLE" || code === "SLOT_BLOCKED") {
        setError("Esse horário não está mais disponível. Escolha outro horário.");
      } else {
        setError("Não foi possível criar o agendamento.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Novo agendamento" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">Serviço</label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            required
            className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationMin}min
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">Horário</label>
          <input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">Nome do cliente</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">Telefone</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+55 85 90000-0000"
            className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-(--color-ink) text-white text-sm font-medium py-2.5 hover:bg-(--color-ink)/90 transition-colors disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Confirmar agendamento"}
        </button>
      </form>
    </Modal>
  );
}
