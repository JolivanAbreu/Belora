import axios from "axios";

// Em desenvolvimento usa o proxy do Vite; em produção, VITE_API_URL.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

function getTokens() {
  return {
    accessToken: localStorage.getItem("belora_access_token"),
    refreshToken: localStorage.getItem("belora_refresh_token"),
  };
}

function setAccessToken(token) {
  localStorage.setItem("belora_access_token", token);
}

export function setTokens({ accessToken, refreshToken }) {
  localStorage.setItem("belora_access_token", accessToken);
  if (refreshToken) localStorage.setItem("belora_refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("belora_access_token");
  localStorage.removeItem("belora_refresh_token");
}

api.interceptors.request.use((config) => {
  const { accessToken } = getTokens();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Tenta renovar o accessToken uma vez em caso de 401 antes de deslogar.
let isRefreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.includes("/auth/");

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      const { refreshToken } = getTokens();
      if (!refreshToken) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        isRefreshing = isRefreshing || axios.post("/api/auth/refresh", { refreshToken });
        const { data } = await isRefreshing;
        isRefreshing = null;
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        isRefreshing = null;
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
