import { useEffect, useMemo, useState, useCallback } from "react";
import { fromZonedTime } from "date-fns-tz";
import { Plus, Lock, Search, CalendarDays, X } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toDateParam, formatTime } from "../lib/format";
import NewAppointmentModal from "../components/NewAppointmentModal";
import BlockTimeModal from "../components/BlockTimeModal";

export default function Agenda() {
  const { tenant } = useAuth();
  const timezone = tenant?.timezone || "America/Fortaleza";

  const [dateFilter, setDateFilter] = useState(toDateParam(new Date()));
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showBlockTime, setShowBlockTime] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const from = fromZonedTime(`${dateFilter}T00:00:00`, timezone).toISOString();
    const to = fromZonedTime(`${dateFilter}T23:59:59.999`, timezone).toISOString();
    const [apptsRes, blocksRes, servicesRes] = await Promise.all([
      api.get("/appointments", { params: { from, to } }),
      api.get("/availability-blocks", { params: { from, to } }),
      api.get("/services"),
    ]);
    setAppointments(apptsRes.data);
    setBlocks(blocksRes.data);
    setServices(servicesRes.data.filter((s) => s.active));
    setLoading(false);
  }, [dateFilter, timezone]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCancel(id) {
    await api.delete(`/appointments/${id}`);
    load();
  }

  async function handleDeletePermanently(id) {
    const confirmed = window.confirm(
      "Excluir este agendamento apaga o registro definitivamente (diferente de cancelar, que mantém o histórico). Tem certeza?"
    );
    if (!confirmed) return;
    await api.delete(`/appointments/${id}/permanent`);
    load();
  }

  async function handleStatusChange(id, status) {
    await api.patch(`/appointments/${id}/status`, { status });
    load();
  }

  async function handleDeleteBlock(id) {
    await api.delete(`/availability-blocks/${id}`);
    load();
  }

  // Combina agendamentos e bloqueios numa única lista ordenada por horário,
  // aplicando os filtros de status e busca.
  const rows = useMemo(() => {
    const apptRows = appointments.map((a) => ({ type: "appointment", data: a, startsAt: a.startsAt }));
    const blockRows = blocks.map((b) => ({ type: "block", data: b, startsAt: b.startsAt }));
    let combined = [...apptRows, ...blockRows].sort(
      (a, b) => new Date(a.startsAt) - new Date(b.startsAt)
    );

    if (statusFilter === "CONFIRMED") combined = combined.filter((r) => r.type === "appointment");
    if (statusFilter === "BLOCK") combined = combined.filter((r) => r.type === "block");

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      combined = combined.filter((r) => {
        if (r.type === "appointment") {
          return (
            r.data.Client?.name?.toLowerCase().includes(term) ||
            r.data.Service?.name?.toLowerCase().includes(term)
          );
        }
        return r.data.reason?.toLowerCase().includes(term);
      });
    }

    return combined;
  }, [appointments, blocks, statusFilter, search]);

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur p-5 rounded-3xl border border-(--color-line) shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-(--color-ink)">
            Agenda de Atendimentos
          </h2>
          <p className="text-xs sm:text-sm text-(--color-ink-soft)">
            Consulte horários, aplique filtros e controle bloqueios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewAppointment(true)}
            disabled={services.length === 0}
            className="px-4 py-2 bg-(--color-ink) text-white rounded-2xl text-xs font-semibold hover:bg-(--color-clay-dark) transition-all flex items-center gap-1.5 shadow disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Agendar
          </button>
          <button
            onClick={() => setShowBlockTime(true)}
            className="px-4 py-2 bg-(--color-lilac-soft) text-(--color-ink) border border-(--color-line) rounded-2xl text-xs font-semibold hover:bg-(--color-line)/40 transition-all flex items-center gap-1.5"
          >
            <Lock className="w-4 h-4" /> Bloqueio
          </button>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur p-4 rounded-3xl border border-(--color-line) shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-(--color-ink)/80 mb-1">
            Filtrar por Data
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl text-xs text-(--color-ink) font-medium focus:outline-none focus:ring-2 focus:ring-(--color-clay)"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-(--color-ink)/80 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl text-xs text-(--color-ink) font-medium focus:outline-none focus:ring-2 focus:ring-(--color-clay)"
          >
            <option value="ALL">Todos os Horários</option>
            <option value="CONFIRMED">Apenas Agendados</option>
            <option value="BLOCK">Apenas Bloqueios</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-(--color-ink)/80 mb-1">
            Buscar Cliente/Procedimento
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-(--color-ink-soft)" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Digitar nome..."
              className="w-full pl-8 pr-3 py-2 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl text-xs text-(--color-ink) focus:outline-none focus:ring-2 focus:ring-(--color-clay)"
            />
          </div>
        </div>
      </div>

      <div className="border border-(--color-line) rounded-3xl overflow-hidden bg-white shadow-sm">
        <div className="bg-(--color-lilac-soft) px-5 py-3.5 border-b border-(--color-line) flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-(--color-ink)">
          <span className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Agendamentos do Dia
          </span>
          <span className="text-(--color-ink-soft) font-normal">
            Fuso horário: {timezone}
          </span>
        </div>

        <div className="divide-y divide-(--color-line)/50 max-h-[600px] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-(--color-ink-soft) px-5 py-8">Carregando agenda...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-(--color-ink-soft) px-5 py-8">
              Nenhum resultado para os filtros selecionados.
            </p>
          ) : (
            rows.map((row) =>
              row.type === "appointment" ? (
                <AppointmentRow
                  key={row.data.id}
                  appointment={row.data}
                  timezone={timezone}
                  onCancel={handleCancel}
                  onDelete={handleDeletePermanently}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <BlockRow
                  key={row.data.id}
                  block={row.data}
                  timezone={timezone}
                  onEdit={setEditingBlock}
                  onDelete={handleDeleteBlock}
                />
              )
            )
          )}
        </div>
      </div>

      {showNewAppointment && (
        <NewAppointmentModal
          date={dateFilter}
          services={services}
          onClose={() => setShowNewAppointment(false)}
          onCreated={() => {
            setShowNewAppointment(false);
            load();
          }}
        />
      )}

      {showBlockTime && (
        <BlockTimeModal
          date={dateFilter}
          timezone={timezone}
          onClose={() => setShowBlockTime(false)}
          onCreated={() => {
            setShowBlockTime(false);
            load();
          }}
        />
      )}

      {editingBlock && (
        <BlockTimeModal
          date={dateFilter}
          block={editingBlock}
          timezone={timezone}
          onClose={() => setEditingBlock(null)}
          onCreated={() => {
            setEditingBlock(null);
            load();
          }}
        />
      )}
    </div>
  );
}

const statusLabels = {
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  concluido: "Concluído",
  nao_compareceu: "Não compareceu",
};

function AppointmentRow({ appointment, timezone, onCancel, onDelete, onStatusChange }) {
  const isCancelled = appointment.status === "cancelado";
  const isPast = new Date(appointment.endsAt) < new Date();

  return (
    <div className="px-5 py-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs font-bold text-(--color-ink) w-12 shrink-0">
          {formatTime(appointment.startsAt, timezone)}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-(--color-ink) truncate">
            {appointment.Client?.name || "Cliente"}
          </p>
          <p className="text-xs text-(--color-ink-soft) truncate">
            {appointment.Service?.name}
            {appointment.presenceConfirmedAt && " · Presença confirmada"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {isPast && appointment.status === "confirmado" ? (
          <select
            value=""
            onChange={(e) => e.target.value && onStatusChange(appointment.id, e.target.value)}
            className="text-[11px] uppercase tracking-wide font-semibold text-(--color-ink) bg-(--color-lilac-soft) border border-(--color-line) rounded-lg px-2 py-1 outline-none cursor-pointer"
          >
            <option value="">Marcar como...</option>
            <option value="concluido">Concluído</option>
            <option value="nao_compareceu">Não compareceu</option>
          </select>
        ) : (
          <span
            className={`text-[11px] uppercase tracking-wide font-semibold ${isCancelled ? "text-(--color-ink-soft)" : "text-(--color-ink)"}`}
          >
            {statusLabels[appointment.status]}
          </span>
        )}
        {appointment.status === "confirmado" && (
          <button
            onClick={() => onCancel(appointment.id)}
            className="text-xs text-(--color-clay-dark) hover:underline"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={() => onDelete(appointment.id)}
          className="text-xs text-(--color-ink-soft) hover:text-red-600 hover:underline"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

function BlockRow({ block, timezone, onEdit, onDelete }) {
  return (
    <div className="px-5 py-3.5 flex items-center justify-between gap-3 bg-(--color-lilac-soft)/40">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs font-bold text-(--color-ink) w-12 shrink-0">
          {formatTime(block.startsAt, timezone)}
        </span>
        <div className="min-w-0 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-(--color-ink-soft) shrink-0" />
          <p className="text-sm text-(--color-ink-soft) truncate">
            {block.reason || "Bloqueado"} até {formatTime(block.endsAt, timezone)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onEdit(block)}
          className="text-xs text-(--color-ink-soft) hover:text-(--color-ink) font-medium"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(block.id)}
          className="text-(--color-ink-soft) hover:text-(--color-clay-dark)"
          aria-label="Remover bloqueio"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
