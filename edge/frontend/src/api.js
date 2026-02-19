const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

async function api(path, { method = "GET", body } = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const Api = {
  login: (email, password) => api("/api/auth/login", { method: "POST", body: { email, password } }),
  register: (email, password) => api("/api/auth/register", { method: "POST", body: { email, password } }),

  vehicles: () => api("/api/vehicles"),
  addVehicle: (vehicle_code, label) => api("/api/vehicles", { method: "POST", body: { vehicle_code, label } }),

  latestTelemetry: (limit = 50) => api(`/api/telemetry/latest?limit=${limit}`),
  latestAlerts: (limit = 50) => api(`/api/alerts/latest?limit=${limit}`)
};
