import { getToken } from "./auth";
import { API_BASE_URL } from "./env";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}
