import { createContext, useContext, useEffect, useState } from "react";
import api, { setTokens, clearTokens } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasToken = !!localStorage.getItem("belora_access_token");
    if (!hasToken) {
      setLoading(false);
      return;
    }
    Promise.all([api.get("/tenant/me"), api.get("/auth/me")])
      .then(([tenantRes, userRes]) => {
        setTenant(tenantRes.data);
        setUser(userRes.data);
      })
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });

    if (data.twoFactorRequired) {
      // Login em duas etapas: a senha já foi validada no backend, mas os
      // tokens de verdade só saem depois do código 2FA (ver completeTwoFactorLogin).
      return { twoFactorRequired: true, twoFactorSessionToken: data.twoFactorSessionToken };
    }

    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    const [tenantRes, userRes] = await Promise.all([api.get("/tenant/me"), api.get("/auth/me")]);
    setTenant(tenantRes.data);
    setUser(userRes.data);
    return { twoFactorRequired: false, tenant: tenantRes.data };
  }

  async function completeTwoFactorLogin(twoFactorSessionToken, code) {
    const { data } = await api.post("/auth/2fa/verify-login", { twoFactorSessionToken, code });
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    const [tenantRes, userRes] = await Promise.all([api.get("/tenant/me"), api.get("/auth/me")]);
    setTenant(tenantRes.data);
    setUser(userRes.data);
    return tenantRes.data;
  }

  function logout() {
    clearTokens();
    setTenant(null);
    setUser(null);
  }

  // Usado pela tela de Configurações após ativar/desativar 2FA, para
  // refletir o novo status sem precisar deslogar e logar de novo.
  async function refreshUser() {
    const { data } = await api.get("/auth/me");
    setUser(data);
    return data;
  }

  // Usado pela tela de Configurações após salvar alterações do tenant
  // (nome, slug, horários, fuso), para refletir os dados novos em toda a
  // aplicação (ex.: link "Ver página de agendamento" no Layout).
  async function refreshTenant() {
    const { data } = await api.get("/tenant/me");
    setTenant(data);
    return data;
  }

  return (
    <AuthContext.Provider value={{ tenant, user, loading, login, completeTwoFactorLogin, logout, refreshTenant, refreshUser, isAuthenticated: !!tenant }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
