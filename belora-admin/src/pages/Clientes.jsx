import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatTime } from "../lib/format";
import Modal from "../components/Modal";

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openClientId, setOpenClientId] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data } = await api.get("/clients", { params: { search } });
      setClients(data);
      setLoading(false);
    }, 250); // debounce simples

    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur p-5 rounded-3xl border border-(--color-line) shadow-sm">
        <h2 className="text-2xl font-display font-bold text-(--color-ink)">Gestão de Clientes</h2>
        <p className="text-xs sm:text-sm text-(--color-ink-soft)">
          Consulte histórico de agendamentos e dados de contato das clientes
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur p-4 rounded-3xl border border-(--color-line) shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-ink-soft)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-9 pr-3.5 py-2 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl text-xs text-(--color-ink) focus:outline-none focus:ring-2 focus:ring-(--color-clay)"
          />
        </div>
      </div>

      <div className="border border-(--color-line) rounded-3xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-(--color-ink)">
            <thead className="bg-(--color-lilac-soft) border-b border-(--color-line) font-semibold text-(--color-ink)/80 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nome</th>
                <th className="px-5 py-3.5">Telefone / WhatsApp</th>
                <th className="px-5 py-3.5">Observações</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-line)/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-(--color-ink-soft)">
                    Carregando...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-(--color-ink-soft)">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3.5 font-medium">{c.name}</td>
                    <td className="px-5 py-3.5 text-(--color-ink-soft)">{c.phone}</td>
                    <td className="px-5 py-3.5 text-(--color-ink-soft) max-w-xs truncate">
                      {c.notes || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setOpenClientId(c.id)}
                        className="text-xs font-semibold text-(--color-ink) hover:underline"
                      >
                        Ver / Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openClientId && (
        <ClientDetailModal clientId={openClientId} onClose={() => setOpenClientId(null)} />
      )}
    </div>
  );
}

function ClientDetailModal({ clientId, onClose }) {
  const { tenant } = useAuth();
  const timezone = tenant?.timezone || "America/Fortaleza";
  const [client, setClient] = useState(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/clients/${clientId}`).then((res) => {
      setClient(res.data);
      setNotes(res.data.notes || "");
    });
  }, [clientId]);

  async function saveNotes() {
    setSaving(true);
    const { data } = await api.patch(`/clients/${clientId}`, { notes });
    setClient(data);
    setSaving(false);
  }

  if (!client) {
    return (
      <Modal title="Cliente" onClose={onClose}>
        <p className="text-sm text-(--color-ink-soft)">Carregando...</p>
      </Modal>
    );
  }

  return (
    <Modal title={client.name} onClose={onClose}>
      <p className="text-sm text-(--color-ink-soft) -mt-2 mb-4">{client.phone}</p>

      <label className="block text-xs font-semibold text-(--color-ink) mb-1.5">
        Observações (tipo de pele, sensibilidades, preferências)
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-(--color-line) px-3.5 py-2.5 text-sm mb-2 outline-none focus:ring-2 focus:ring-(--color-clay) bg-(--color-lilac-soft)"
      />
      <button
        onClick={saveNotes}
        disabled={saving}
        className="text-xs font-semibold text-(--color-clay-dark) hover:underline disabled:opacity-60 mb-6"
      >
        {saving ? "Salvando..." : "Salvar observações"}
      </button>

      <h3 className="text-xs font-semibold uppercase tracking-wide text-(--color-ink-soft) mb-3">
        Histórico de atendimentos
      </h3>

      {!client.Appointments || client.Appointments.length === 0 ? (
        <p className="text-sm text-(--color-ink-soft)">Nenhum atendimento ainda.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto thin-scroll">
          {client.Appointments.slice()
            .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt))
            .map((appt) => (
              <div
                key={appt.id}
                className="rounded-xl border border-(--color-line) bg-(--color-lilac-soft) px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-(--color-ink) font-medium">{appt.Service?.name}</p>
                  <p className="text-xs text-(--color-ink-soft)">
                    {formatLongDate(appt.startsAt)} às {formatTime(appt.startsAt, timezone)}
                  </p>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-(--color-ink-soft)">
                  {appt.status}
                </span>
              </div>
            ))}
        </div>
      )}
    </Modal>
  );
}

function formatLongDate(iso) {
  return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}
