import { getToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();

  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}
