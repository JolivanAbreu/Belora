import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
import api from "../lib/api";
import Modal from "../components/Modal";

export default function Servicos() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

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

  const visibleServices = useMemo(() => {
    let list = services;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(term));
    }
    list = [...list].sort((a, b) => {
      if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
      if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
      if (sortBy === "duration") return a.durationMin - b.durationMin;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [services, search, sortBy]);

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur p-5 rounded-3xl border border-(--color-line) shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-(--color-ink)">Catálogo de Serviços</h2>
          <p className="text-xs sm:text-sm text-(--color-ink-soft)">
            Gerencie preços, tempo de execução e exposição na booking page pública
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="px-4 py-2.5 bg-(--color-ink) text-white rounded-2xl text-xs font-semibold hover:bg-(--color-clay-dark) transition-all flex items-center gap-2 shadow shrink-0"
        >
          <Plus className="w-4 h-4" /> Novo Serviço
        </button>
      </div>

      <div className="bg-white/90 backdrop-blur p-4 rounded-3xl border border-(--color-line) shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-ink-soft)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar procedimento..."
            className="w-full pl-9 pr-3.5 py-2 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl text-xs text-(--color-ink) focus:outline-none focus:ring-2 focus:ring-(--color-clay)"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-(--color-ink)/80 whitespace-nowrap">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3.5 py-2 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl text-xs text-(--color-ink) font-medium focus:outline-none focus:ring-2 focus:ring-(--color-clay)"
          >
            <option value="name">Nome (A-Z)</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
            <option value="duration">Duração (Menor para Maior)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-(--color-ink-soft)">Carregando...</p>
      ) : visibleServices.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-(--color-line) py-16 text-center text-(--color-ink-soft) text-sm bg-white/50">
          Nenhum serviço encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleServices.map((s) => (
            <div
              key={s.id}
              className={`bg-white/90 rounded-3xl border border-(--color-line) shadow-sm p-5 flex flex-col gap-3 ${!s.active ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="p-2.5 bg-(--color-lilac-soft) rounded-2xl text-(--color-ink) border border-(--color-line) shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-lg font-display font-bold text-(--color-ink)">
                  R$ {Number(s.price).toFixed(2)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-(--color-ink)">{s.name}</p>
                <p className="text-xs text-(--color-ink-soft) mt-0.5">{s.durationMin} minutos</p>
              </div>
              <div className="flex items-center gap-4 pt-2 mt-auto border-t border-(--color-line)/60">
                <button
                  onClick={() => {
                    setEditing(s);
                    setShowForm(true);
                  }}
                  className="text-xs font-semibold text-(--color-ink) hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActive(s)}
                  className="text-xs font-semibold text-(--color-clay-dark) hover:underline"
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
  const [description, setDescription] = useState(service?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { name, durationMin: Number(durationMin), price: Number(price), description };
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
          <label className="block text-xs font-semibold text-(--color-ink) mb-1.5">Nome</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Limpeza de pele profunda"
            className="w-full rounded-xl bg-(--color-lilac-soft) border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-(--color-clay)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-(--color-ink) mb-1.5">Duração (min)</label>
            <input
              type="number"
              required
              min={5}
              step={5}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="w-full rounded-xl bg-(--color-lilac-soft) border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-(--color-clay)"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-(--color-ink) mb-1.5">Preço (R$)</label>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl bg-(--color-lilac-soft) border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-(--color-clay)"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-(--color-ink) mb-1.5">
            Descrição Curta <span className="text-(--color-ink-soft) font-normal">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: Extração de cravos, esfoliação e hidratação profunda."
            className="w-full rounded-xl bg-(--color-lilac-soft) border border-(--color-line) px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-(--color-clay)"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-(--color-ink) text-white text-sm font-semibold py-2.5 hover:bg-(--color-clay-dark) transition-colors disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </Modal>
  );
}
