import axios from "axios";

const api = axios.create({ baseURL: "/api" });

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

export default api;
