"use server";

import {
  clearSessionServer,
  getRefreshTokenServer,
  getTokenServer,
  setAccessTokenServer,
} from "./auth";
import { API_BASE_URL } from "./env";

async function send(path: string, init: RequestInit, token?: string | null,): Promise<Response> {
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
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

export type ApiFetchClientResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

export async function apiFetchClient(path: string, init: RequestInit = {}, formData?: FormData,): Promise<ApiFetchClientResult> {
  const response = await apiFetch(path, {
    ...init,
    body: formData ?? init.body,
  });

  if (response.status === 204) {
    return { ok: response.ok, status: response.status, body: null };
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return {
      ok: response.ok,
      status: response.status,
      body: await response.json().catch(() => null),
    };
  }

  if (
    contentType.includes("application/pdf") ||
    contentType.includes("octet-stream")
  ) {
    return {
      ok: response.ok,
      status: response.status,
      body: Buffer.from(await response.arrayBuffer()).toString("base64"),
    };
  }

  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    body: text || null,
  };
}
