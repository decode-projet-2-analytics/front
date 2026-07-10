import {
  clearSessionServer,
  getRefreshTokenServer,
  getTokenServer,
  setAccessTokenServer,
} from "./auth";
import { API_BASE_URL } from "./env";

async function send(path: string, init: RequestInit, token?: string | null,): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await getRefreshTokenServer();
    if (!refreshToken) return null;

    const res = await send("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { accessToken?: string; token?: string };
    const accessToken = data.accessToken ?? data.token;
    if (!accessToken) return null;

    await setAccessTokenServer(accessToken);
    return accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function forceLogin() {
  if (!(await clearSessionServer())) return;

  const { getLocale } = await import("next-intl/server");
  const { redirect } = await import("@/i18n/navigation");
  redirect({ href: "/login", locale: await getLocale() });
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getTokenServer();
  const response = await send(path, init, token);
  if (response.status !== 401 || path.startsWith("/auth/")) return response;

  const nextToken = await refreshAccessToken();
  if (nextToken) return send(path, init, nextToken);

  await forceLogin();
  return response;
}
