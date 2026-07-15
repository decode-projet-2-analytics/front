"use server";

import { apiFetchClient } from "./api";
import {
  clearSessionServer,
  setAccessTokenServer,
  setRefreshTokenServer,
} from "./auth";

export type LoginResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: "invalid" | "rejected" | "pending" };

function getSafeRedirectPath(redirectTo: string | undefined): string {
  if (
    !redirectTo ||
    !redirectTo.startsWith("/") ||
    redirectTo.startsWith("//")
  ) {
    return "/dashboard";
  }
  return redirectTo;
}

export async function loginAction(
  email: string,
  password: string,
  redirectTo?: string,
): Promise<LoginResult> {
  const response = await apiFetchClient("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 403) {
    const body = response.body as { error?: { message?: string } } | null;
    const message = body?.error?.message?.toLowerCase() ?? "";
    if (message.includes("attente")) {
      return { ok: false, error: "pending" };
    }
    return { ok: false, error: "rejected" };
  }

  if (!response.ok) {
    return { ok: false, error: "invalid" };
  }

  const data = response.body as {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
  } | null;
  const accessToken = data?.accessToken ?? data?.token;
  if (!accessToken) {
    return { ok: false, error: "invalid" };
  }

  const accessOk = await setAccessTokenServer(accessToken);
  if (!accessOk) {
    return { ok: false, error: "invalid" };
  }
  if (data?.refreshToken) {
    await setRefreshTokenServer(data.refreshToken);
  }

  return { ok: true, redirectTo: getSafeRedirectPath(redirectTo) };
}

export async function logoutAction(): Promise<{ ok: true }> {
  await clearSessionServer();
  return { ok: true };
}
