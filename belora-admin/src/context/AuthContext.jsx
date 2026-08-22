import { createContext, useContext, useEffect, useState } from "react";
import api, { setTokens, clearTokens } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasToken = !!localStorage.getItem("belora_access_token");
    if (!hasToken) {
      setLoading(false);
      return;
    }
    api
      .get("/tenant/me")
      .then((res) => setTenant(res.data))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    const { data: tenantData } = await api.get("/tenant/me");
    setTenant(tenantData);
    return tenantData;
  }

  function logout() {
    clearTokens();
    setTenant(null);
  }

  return (
    <AuthContext.Provider value={{ tenant, loading, login, logout, isAuthenticated: !!tenant }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
