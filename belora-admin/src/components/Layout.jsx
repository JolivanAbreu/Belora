import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, Calendar, Sparkles, Users, Bell, Settings, LogOut, ExternalLink, LineChart } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Visão geral", Icon: BarChart3 },
  { to: "/agenda", label: "Agenda", Icon: Calendar },
  { to: "/servicos", label: "Serviços", Icon: Sparkles },
  { to: "/clientes", label: "Clientes", Icon: Users },
  { to: "/relatorios", label: "Relatórios", Icon: LineChart },
  { to: "/notificacoes", label: "Notificações", Icon: Bell },
  { to: "/configuracoes", label: "Configurações", Icon: Settings },
];

// A booking page é um app separado, com sua própria URL.
const BOOKING_BASE_URL = import.meta.env.VITE_BOOKING_URL || "http://localhost:5174";

export default function Layout() {
  const { tenant, logout } = useAuth();
  const bookingUrl = tenant?.slug ? `${BOOKING_BASE_URL}/${tenant.slug}` : null;

  return (
    <div className="min-h-screen wave-bg flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-(--color-line) px-4 lg:px-8 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-(--color-ink) text-white flex items-center justify-center font-display font-bold text-xl shadow-md shrink-0">
                B
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-(--color-ink) leading-tight">
                  Belora
                </h1>
                <p className="text-xs text-(--color-ink-soft) hidden sm:block">
                  {tenant?.name}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1 bg-(--color-lilac-soft) p-1.5 rounded-2xl border border-(--color-line) thin-scroll">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-(--color-ink) text-white shadow-sm"
                      : "text-(--color-ink) hover:bg-(--color-line)/40"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-(--color-ink) hover:bg-(--color-line)/40 transition-all shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {bookingUrl && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--color-ink) hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver página de agendamento da cliente
          </a>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
