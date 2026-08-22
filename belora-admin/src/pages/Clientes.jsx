import { useEffect, useState } from "react";
import api from "../lib/api";
import { formatTime } from "../lib/format";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data } = await api.get("/clients", { params: { search } });
      setClients(data);
      setLoading(false);
    }, 250); // debounce simples

    return () => clearTimeout(timeout);
  }, [search]);

  async function openClient(id) {
    const { data } = await api.get(`/clients/${id}`);
    setSelected(data);
  }

  return (
    <div className="p-8 max-w-5xl flex gap-8">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-(--color-ink) mb-5">Clientes</h1>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm mb-4 outline-none focus:border-(--color-clay) bg-(--color-surface)"
        />

        {loading ? (
          <p className="text-sm text-(--color-ink-soft)">Carregando...</p>
        ) : clients.length === 0 ? (
          <p className="text-sm text-(--color-ink-soft)">Nenhum cliente encontrado.</p>
        ) : (
          <div className="space-y-1.5">
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => openClient(c.id)}
                className={`w-full text-left rounded-lg px-3.5 py-2.5 flex items-center gap-3 transition-colors ${
                  selected?.id === c.id ? "bg-(--color-lilac-soft)" : "hover:bg-(--color-surface)"
                }`}
              >
                <span className="w-8 h-8 rounded-full bg-(--color-ink) text-white text-xs flex items-center justify-center font-medium shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-(--color-ink) truncate">{c.name}</span>
                  <span className="block text-xs text-(--color-ink-soft) truncate">{c.phone}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 pt-14">
        {selected ? <ClientDetail client={selected} onUpdated={setSelected} /> : (
          <p className="text-sm text-(--color-ink-soft)">Selecione um cliente para ver o histórico.</p>
        )}
      </div>
    </div>
  );
}

function ClientDetail({ client, onUpdated }) {
  const [notes, setNotes] = useState(client.notes || "");
  const [saving, setSaving] = useState(false);

  async function saveNotes() {
    setSaving(true);
    const { data } = await api.patch(`/clients/${client.id}`, { notes });
    onUpdated(data);
    setSaving(false);
  }

  return (
    <div>
      <h2 className="font-display text-xl text-(--color-ink)">{client.name}</h2>
      <p className="text-sm text-(--color-ink-soft) mb-6">{client.phone}</p>

      <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">
        Observações (tipo de pele, sensibilidades, preferências)
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm mb-2 outline-none focus:border-(--color-clay) bg-(--color-surface)"
      />
      <button
        onClick={saveNotes}
        disabled={saving}
        className="text-xs text-(--color-clay-dark) hover:underline disabled:opacity-60 mb-8"
      >
        {saving ? "Salvando..." : "Salvar observações"}
      </button>

      <h3 className="text-xs uppercase tracking-wide text-(--color-ink-soft) mb-3">
        Histórico de atendimentos
      </h3>

      {!client.Appointments || client.Appointments.length === 0 ? (
        <p className="text-sm text-(--color-ink-soft)">Nenhum atendimento ainda.</p>
      ) : (
        <div className="space-y-2">
          {client.Appointments.slice()
            .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt))
            .map((appt) => (
              <div
                key={appt.id}
                className="rounded-lg border border-(--color-line) bg-(--color-surface) px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-(--color-ink)">{appt.Service?.name}</p>
                  <p className="text-xs text-(--color-ink-soft)">
                    {formatLongDate(appt.startsAt)} às {formatTime(appt.startsAt)}
                  </p>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-(--color-ink-soft)">
                  {appt.status}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function formatLongDate(iso) {
  return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}
