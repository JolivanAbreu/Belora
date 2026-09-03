import { useEffect, useState } from "react";
import { TrendingUp, AlertTriangle, Trophy } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../lib/api";

const MONTH_LABELS = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai", "06": "Jun",
  "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

function formatMonthLabel(yyyyMM) {
  const [, month] = yyyyMM.split("-");
  return MONTH_LABELS[month] || yyyyMM;
}

export default function Relatorios() {
  const [summary, setSummary] = useState(null);
  const [topServices, setTopServices] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [summaryRes, topRes] = await Promise.all([
        api.get("/reports/summary", { params: { months: 6 } }),
        api.get("/reports/top-services", { params: { months: 6 } }),
      ]);
      setSummary(summaryRes.data.months.map((m) => ({ ...m, label: formatMonthLabel(m.month) })));
      setTopServices(topRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const totalRevenue = summary?.reduce((sum, m) => sum + m.revenue, 0) || 0;
  const monthsWithData = summary?.filter((m) => m.noShowRate !== null) || [];
  const avgNoShowRate =
    monthsWithData.length > 0
      ? Math.round((monthsWithData.reduce((sum, m) => sum + m.noShowRate, 0) / monthsWithData.length) * 10) / 10
      : null;

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur p-5 rounded-3xl border border-(--color-line) shadow-sm">
        <h2 className="text-2xl font-display font-bold text-(--color-ink)">Relatórios</h2>
        <p className="text-xs sm:text-sm text-(--color-ink-soft)">
          Faturamento e taxa de não comparecimento dos últimos 6 meses
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-(--color-ink-soft)">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/90 p-5 rounded-3xl border border-(--color-line) shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-(--color-ink-soft) uppercase tracking-wider">
                  Faturamento (6 meses)
                </span>
                <div className="p-2.5 bg-(--color-lilac-soft) rounded-2xl text-(--color-ink) border border-(--color-line)">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-display font-bold text-(--color-ink) mt-3">
                R$ {totalRevenue.toFixed(2)}
              </p>
              <p className="text-[11px] text-(--color-ink-soft) mt-1">
                Só considera atendimentos marcados como concluídos
              </p>
            </div>

            <div className="bg-white/90 p-5 rounded-3xl border border-(--color-line) shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-(--color-ink-soft) uppercase tracking-wider">
                  Taxa média de não comparecimento
                </span>
                <div className="p-2.5 bg-(--color-lilac-soft) rounded-2xl text-(--color-ink) border border-(--color-line)">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-display font-bold text-(--color-ink) mt-3">
                {avgNoShowRate === null ? "—" : `${avgNoShowRate}%`}
              </p>
              <p className="text-[11px] text-(--color-ink-soft) mt-1">
                Faltas em relação a atendimentos concluídos + faltas (exclui cancelamentos)
              </p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-3xl p-5 sm:p-6 border border-(--color-line) shadow-sm">
            <h3 className="font-display font-bold text-lg text-(--color-ink) mb-4">
              Faturamento por mês
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={summary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBC8C8" />
                <XAxis dataKey="label" tick={{ fill: "#5B4A72", fontSize: 12 }} />
                <YAxis tick={{ fill: "#5B4A72", fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Faturamento"]}
                  contentStyle={{ borderRadius: 12, borderColor: "#EBC8C8" }}
                />
                <Bar dataKey="revenue" fill="#9E6F71" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-3xl p-5 sm:p-6 border border-(--color-line) shadow-sm">
            <h3 className="font-display font-bold text-lg text-(--color-ink) mb-4">
              Taxa de não comparecimento por mês
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={summary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBC8C8" />
                <XAxis dataKey="label" tick={{ fill: "#5B4A72", fontSize: 12 }} />
                <YAxis tick={{ fill: "#5B4A72", fontSize: 12 }} unit="%" />
                <Tooltip
                  formatter={(value) => (value === null ? ["Sem dados", ""] : [`${value}%`, "Não comparecimento"])}
                  contentStyle={{ borderRadius: 12, borderColor: "#EBC8C8" }}
                />
                <Line type="monotone" dataKey="noShowRate" stroke="#A66F5E" strokeWidth={2} connectNulls dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-3xl p-5 sm:p-6 border border-(--color-line) shadow-sm">
            <h3 className="font-display font-bold text-lg text-(--color-ink) mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Serviços mais rentáveis
            </h3>
            {topServices?.length === 0 ? (
              <p className="text-sm text-(--color-ink-soft)">
                Nenhum atendimento concluído ainda nos últimos 6 meses.
              </p>
            ) : (
              <div className="space-y-2">
                {topServices?.map((s, i) => (
                  <div
                    key={s.serviceId}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-(--color-lilac-soft) border border-(--color-line)"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-(--color-ink) text-white text-xs flex items-center justify-center font-semibold shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-(--color-ink)">{s.name}</p>
                        <p className="text-xs text-(--color-ink-soft)">{s.count} atendimento(s)</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-(--color-ink)">
                      R$ {s.revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
