import { useEffect, useState } from "react";
import api from "../lib/api";
import { IconPlus } from "../components/icons";
import Modal from "../components/Modal";

export default function Servicos() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/services");
    setServices(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(service) {
    if (service.active) {
      await api.delete(`/services/${service.id}`); // desativa (soft-delete) - ver RF-10
    } else {
      await api.patch(`/services/${service.id}`, { active: true });
    }
    load();
  }

  return (
    <div className="p-8 max-w-3xl">
      <header className="flex items-center justify-between mb-7">
        <h1 className="font-display text-2xl text-(--color-ink)">Serviços</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-(--color-ink) text-white text-sm font-medium px-4 py-2.5 hover:bg-(--color-ink)/90 transition-colors"
        >
          <IconPlus className="w-4 h-4" />
          Novo serviço
        </button>
      </header>

      {loading ? (
        <p className="text-sm text-(--color-ink-soft)">Carregando...</p>
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-(--color-line) py-16 text-center text-(--color-ink-soft) text-sm">
          Nenhum serviço cadastrado ainda.
        </div>
      ) : (
        <div className="grid gap-3">
          {services.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl border border-(--color-line) bg-(--color-surface) px-5 py-4 flex items-center justify-between ${!s.active ? "opacity-50" : ""}`}
            >
              <div>
                <p className="text-sm font-medium text-(--color-ink)">{s.name}</p>
                <p className="text-xs text-(--color-ink-soft) mt-0.5">
                  {s.durationMin} min · R$ {Number(s.price).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setEditing(s);
                    setShowForm(true);
                  }}
                  className="text-xs text-(--color-ink-soft) hover:text-(--color-ink)"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActive(s)}
                  className="text-xs text-(--color-clay-dark) hover:underline"
                >
                  {s.active ? "Desativar" : "Reativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ServiceFormModal
          service={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ServiceFormModal({ service, onClose, onSaved }) {
  const [name, setName] = useState(service?.name || "");
  const [durationMin, setDurationMin] = useState(service?.durationMin || 30);
  const [price, setPrice] = useState(service?.price || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { name, durationMin: Number(durationMin), price: Number(price) };
      if (service) {
        await api.patch(`/services/${service.id}`, payload);
      } else {
        await api.post("/services", payload);
      }
      onSaved();
    } catch {
      setError("Não foi possível salvar o serviço.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={service ? "Editar serviço" : "Novo serviço"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">Nome</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Limpeza de pele profunda"
            className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">Duração (min)</label>
            <input
              type="number"
              required
              min={5}
              step={5}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">Preço (R$)</label>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:border-(--color-clay)"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-(--color-ink) text-white text-sm font-medium py-2.5 hover:bg-(--color-ink)/90 transition-colors disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </Modal>
  );
}
