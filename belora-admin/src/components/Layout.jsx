import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconAgenda, IconServices, IconClients, IconLogout } from "./icons";

const navItems = [
  { to: "/agenda", label: "Agenda", Icon: IconAgenda },
  { to: "/servicos", label: "Serviços", Icon: IconServices },
  { to: "/clientes", label: "Clientes", Icon: IconClients },
];

export default function Layout() {
  const { tenant, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-(--color-canvas)">
      <aside className="w-64 shrink-0 bg-(--color-ink) text-white flex flex-col">
        <div className="px-6 py-7">
          <span className="font-display text-2xl italic tracking-tight">Belora</span>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mt-1">
            {tenant?.name || "Painel"}
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-white/12 text-white font-medium"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="mx-3 mb-6 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-white/60 hover:bg-white/8 hover:text-white transition-colors"
        >
          <IconLogout className="w-[18px] h-[18px]" />
          Sair
        </button>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
