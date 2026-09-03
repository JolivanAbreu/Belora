import { useState } from "react";
import { CheckCircle2, Info } from "lucide-react";

export default function Plano() {
  const [showNote, setShowNote] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white/90 backdrop-blur p-5 sm:p-7 rounded-3xl border border-(--color-line) shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-(--color-ink)">Plano e Faturamento</h2>
          <p className="text-xs sm:text-sm text-(--color-ink-soft)">
            Modelo de assinatura Belora SaaS — ver Documento Comercial
          </p>
        </div>

        <div className="rounded-2xl bg-(--color-lilac-soft) border border-(--color-line) p-4 flex items-start gap-3 text-xs text-(--color-ink)">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Esta tela mostra os planos previstos no roadmap comercial do Belora, mas a
            cobrança recorrente ainda não está implementada no backend (RF-60/RF-61
            do SRS seguem pendentes). Por enquanto, o uso é gratuito para o tenant piloto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-(--color-lilac-soft) to-(--color-canvas) p-6 rounded-3xl border border-(--color-line) flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xs font-semibold bg-(--color-ink) text-white px-3 py-1 rounded-full uppercase tracking-wider">
                Plano Atual
              </span>
              <h3 className="text-2xl font-display font-bold text-(--color-ink) mt-4">Belora Básico</h3>
              <p className="text-xs text-(--color-ink)/80 mt-1">
                Agenda ilimitada, booking page pública, painel administrativo completo
              </p>
              <p className="text-3xl font-bold text-(--color-ink) mt-5">
                Grátis <span className="text-xs font-normal text-(--color-ink)/70">durante o piloto</span>
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-(--color-line) flex justify-between items-center text-xs">
              <span className="text-(--color-ink)/70">Sem data de renovação</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Ativo
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-(--color-line) flex flex-col justify-between shadow-sm opacity-80">
            <div>
              <span className="text-xs font-semibold bg-(--color-line) text-(--color-ink) px-3 py-1 rounded-full uppercase tracking-wider">
                Em breve
              </span>
              <h3 className="text-xl font-display font-bold text-(--color-ink) mt-4">Belora Profissional</h3>
              <p className="text-xs text-(--color-ink)/70 mt-1">
                Relatórios de faturamento e histórico de clientes avançado
              </p>
              <p className="text-2xl font-bold text-(--color-ink) mt-5">
                R$ 69,90<span className="text-xs font-normal text-(--color-ink)/70">/mês (previsto)</span>
              </p>
            </div>
            <button
              onClick={() => setShowNote(true)}
              className="mt-6 w-full py-3 bg-(--color-line)/60 text-(--color-ink) rounded-xl text-xs font-semibold cursor-not-allowed text-center"
            >
              Cobrança ainda não disponível
            </button>
          </div>
        </div>

        {showNote && (
          <p className="text-xs text-(--color-ink-soft) text-center">
            Assim que a integração de pagamento for implementada, você poderá fazer upgrade por aqui.
          </p>
        )}
      </div>
    </div>
  );
}
