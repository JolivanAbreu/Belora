import axios from "axios";

// Mesma lógica do painel admin - ver DEPLOY.md.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

export async function getTenantInfo(slug) {
  const { data } = await api.get(`/public/${slug}/info`);
  return data;
}

export async function getTenantServices(slug) {
  const { data } = await api.get(`/public/${slug}/services`);
  return data;
}

export async function getAvailability(slug, serviceId, date) {
  const { data } = await api.get(`/public/${slug}/availability`, {
    params: { serviceId, date },
  });
  return data.slots;
}

export async function createAppointment(slug, { serviceId, startsAt, client }) {
  const { data } = await api.post(`/public/${slug}/appointments`, {
    serviceId,
    startsAt,
    client,
  });
  return data;
}

export async function cancelAppointment(slug, appointmentId, token) {
  const { data } = await api.post(`/public/${slug}/appointments/${appointmentId}/cancel`, { token });
  return data;
}

export async function confirmPresence(slug, appointmentId, token) {
  const { data } = await api.post(`/public/${slug}/appointments/${appointmentId}/confirm-presence`, { token });
  return data;
}

export default api;
