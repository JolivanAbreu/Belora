import { useState } from "react";
import { Save, MessageSquare } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import TwoFactorSection from "../components/TwoFactorSection";

const TIMEZONE_OPTIONS = [
  { value: "America/Fortaleza", label: "America/Fortaleza (UTC-03:00)" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo (UTC-03:00)" },
  { value: "America/Manaus", label: "America/Manaus (UTC-04:00)" },
];

const WEEK_DAYS = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

const DEFAULT_TEMPLATES = {
  confirmation:
    "Olá, {cliente}! Seu agendamento de {servico} foi confirmado para {data} às {hora}, " +
    "com {estabelecimento}. Endereço: {endereco}\n\nPrecisa cancelar? {link_cancelamento}",
  reminder_24h:
    "Olá, {cliente}! Passando para lembrar: você tem {servico} amanhã às {hora}, com " +
    "{estabelecimento}. Endereço: {endereco}\n\nPrecisa cancelar? {link_cancelamento}",
  reminder_2h:
    "Olá, {cliente}! Seu horário de {servico} é daqui a pouco, às {hora}, com " +
    "{estabelecimento}. Te esperamos!",
  reminder_30min:
    "Olá, {cliente}! Faltam 30 minutos para o seu {servico} às {hora}, com {estabelecimento}. " +
    "Endereço: {endereco}\n\nPor favor confirme sua presença: {link_confirmacao}\n" +
    "Precisa cancelar? {link_cancelamento}",
};

const TEMPLATE_FIELDS = [
  { key: "confirmation", label: "Confirmação (enviada na hora do agendamento)" },
  { key: "reminder_24h", label: "Lembrete — 24h antes" },
  { key: "reminder_2h", label: "Lembrete — 2h antes" },
  { key: "reminder_30min", label: "Lembrete — 30min antes (com confirmação de presença)" },
];

// Constrói o estado inicial de cada dia a partir do businessHours atual do
// tenant. Simplificação consciente: a tela edita um único intervalo por
// dia (aberto: de-até). O modelo do backend suporta múltiplos intervalos
// por dia (ex.: pausa de almoço separada), mas isso ainda não tem
// interface própria - ver README, "o que falta antes de produção".
function buildInitialDaysState(businessHours) {
  const state = {};
  for (const { key } of WEEK_DAYS) {
    const ranges = businessHours?.[key] || [];
    const first = ranges[0];
    state[key] = {
      open: !!first,
      from: first?.[0] || "09:00",
      to: first?.[1] || "18:00",
    };
  }
  return state;
}

export default function Configuracoes() {
  const { tenant, refreshTenant } = useAuth();

  const [name, setName] = useState(tenant?.name || "");
  const [slug, setSlug] = useState(tenant?.slug || "");
  const [address, setAddress] = useState(tenant?.address || "");
  const [timezone, setTimezone] = useState(tenant?.timezone || "America/Fortaleza");
  const [days, setDays] = useState(() => buildInitialDaysState(tenant?.businessHours));
  const [templates, setTemplates] = useState(() => ({ ...DEFAULT_TEMPLATES, ...(tenant?.messageTemplates || {}) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function updateDay(key, patch) {
    setDays((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function updateTemplate(key, value) {
    setTemplates((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    for (const { key, label } of WEEK_DAYS) {
      const day = days[key];
      if (day.open && day.from >= day.to) {
        setError(`Em ${label}, o horário de fechamento deve ser depois da abertura.`);
        setSaving(false);
        return;
      }
    }

    const businessHours = {};
    for (const { key } of WEEK_DAYS) {
      const day = days[key];
      businessHours[key] = day.open ? [[day.from, day.to]] : [];
    }

    try {
      await api.patch("/tenant/me", { name, slug, businessHours, timezone, address, messageTemplates: templates });
      await refreshTenant();
      setSaved(true);
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === "SLUG_TAKEN") {
        setError("Esse link já está em uso por outro estabelecimento. Escolha outro.");
      } else if (code === "INVALID_SLUG") {
        setError("O link deve conter apenas letras minúsculas, números e hífens.");
      } else {
        setError("Não foi possível salvar as alterações.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white/90 backdrop-blur p-5 sm:p-7 rounded-3xl border border-(--color-line) shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-(--color-ink)">
            Configurações do Estabelecimento
          </h2>
          <p className="text-xs sm:text-sm text-(--color-ink-soft)">
            Ajuste o nome, link de agendamento e horário de funcionamento por dia da semana
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-(--color-ink) mb-1.5">
              Nome do Estabelecimento
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl text-xs text-(--color-ink) focus:outline-none focus:ring-2 focus:ring-(--color-clay)"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-(--color-ink) mb-1.5">
              Link do Agendamento Público
            </label>
            <div className="flex">
              <span className="px-3.5 py-2.5 bg-(--color-line)/40 border border-r-0 border-(--color-line) rounded-l-xl text-xs text-(--color-ink)/70 whitespace-nowrap">
                belora.app/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Apenas letras minúsculas, números e hífens"
                className="w-full px-3.5 py-2.5 bg-(--color-lilac-soft) border border-(--color-line) rounded-r-xl text-xs text-(--color-ink) focus:outline-none focus:ring-2 focus:ring-(--color-clay)"
              />
            </div>
            <p className="text-[11px] text-(--color-ink-soft) mt-1">
              Alterar o link muda a URL que suas clientes usam para agendar — avise quem já tiver salvo o link antigo.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-(--color-ink) mb-2">
              Horário de Funcionamento por Dia
            </label>
            <div className="space-y-2">
              {WEEK_DAYS.map(({ key, label }) => {
                const day = days[key];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl"
                  >
                    <label className="flex items-center gap-2 w-28 shrink-0 text-xs font-medium text-(--color-ink) cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.open}
                        onChange={(e) => updateDay(key, { open: e.target.checked })}
                        className="rounded border-(--color-line) text-(--color-ink) focus:ring-(--color-clay)"
                      />
                      {label}
                    </label>

                    {day.open ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={day.from}
                          onChange={(e) => updateDay(key, { from: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 bg-(--color-surface) border border-(--color-line) rounded-lg text-xs text-(--color-ink)"
                        />
                        <span className="text-(--color-ink-soft) text-xs">até</span>
                        <input
                          type="time"
                          value={day.to}
                          onChange={(e) => updateDay(key, { to: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 bg-(--color-surface) border border-(--color-line) rounded-lg text-xs text-(--color-ink)"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-(--color-ink-soft) italic flex-1">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-(--color-ink-soft) mt-2">
              Um único intervalo por dia. Para uma pausa no meio do expediente (ex.: almoço),
              ainda é preciso usar um bloqueio manual na Agenda.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-(--color-ink) mb-1.5">
              Endereço do Estabelecimento
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro, cidade"
              className="w-full px-3.5 py-2.5 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl text-xs text-(--color-ink) focus:outline-none focus:ring-2 focus:ring-(--color-clay)"
            />
            <p className="text-[11px] text-(--color-ink-soft) mt-1">
              Usado no lugar de <code>{"{endereco}"}</code> nas mensagens de WhatsApp abaixo.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-(--color-ink) mb-1.5">
              Fuso Horário Oficial
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl text-xs text-(--color-ink)"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-(--color-line)">
            <label className="flex items-center gap-2 text-xs font-semibold text-(--color-ink) mb-1.5 mt-4">
              <MessageSquare className="w-4 h-4" />
              Mensagens de WhatsApp
            </label>
            <p className="text-[11px] text-(--color-ink-soft) mb-3">
              Personalize o texto de cada mensagem enviada automaticamente. Placeholders disponíveis:{" "}
              <code>{"{cliente}"}</code> <code>{"{servico}"}</code> <code>{"{data}"}</code>{" "}
              <code>{"{hora}"}</code> <code>{"{estabelecimento}"}</code> <code>{"{endereco}"}</code>{" "}
              <code>{"{link_cancelamento}"}</code> <code>{"{link_confirmacao}"}</code> (este último só
              funciona no lembrete de 30min).
            </p>
            <div className="space-y-4">
              {TEMPLATE_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-(--color-ink)/80 mb-1">
                    {label}
                  </label>
                  <textarea
                    rows={3}
                    value={templates[key]}
                    onChange={(e) => updateTemplate(key, e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl text-xs text-(--color-ink) focus:outline-none focus:ring-2 focus:ring-(--color-clay) font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-emerald-700">Alterações salvas com sucesso.</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-(--color-ink) text-white rounded-xl text-xs font-semibold hover:bg-(--color-clay-dark) transition-all flex items-center gap-2 shadow disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </form>
      </div>

      <TwoFactorSection />
    </div>
  );
}
