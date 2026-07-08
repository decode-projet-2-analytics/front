import { getToken, getTokenServer } from "./auth";
import { API_BASE_URL } from "./env";

async function apiFetchWithToken(
  token: string | null | undefined,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  return apiFetchWithToken(getToken(), path, init);
}

export async function apiFetchServer(path: string, init: RequestInit = {}) {
  const token = await getTokenServer();
  return apiFetchWithToken(token, path, init);
}
