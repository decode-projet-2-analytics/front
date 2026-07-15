const TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";
const ADMIN_TOKEN_COOKIE = "adminToken";

const AUTH_COOKIES = [
  TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ADMIN_TOKEN_COOKIE,
] as const;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export const getToken = () => getCookie(TOKEN_COOKIE);
export const getRefreshToken = () => getCookie(REFRESH_TOKEN_COOKIE);

export const getTokenServer = async () => {
  const { cookies } = await import("next/headers");
  return (await cookies()).get(TOKEN_COOKIE)?.value;
};

export const getRefreshTokenServer = async () => {
  const { cookies } = await import("next/headers");
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
};

export const setToken = (token: string) => {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
};

export const setRefreshToken = (token: string) => {
  document.cookie = `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
};

/** Clear all auth cookies in the browser. */
export function clearSession() {
  for (const name of AUTH_COOKIES) clearCookie(name);
}

/** @deprecated Prefer `clearSession`. */
export const removeToken = clearSession;

/** Clear all auth cookies from a Server Action. Returns false in RSC render. */
export async function clearSessionServer(): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    for (const name of AUTH_COOKIES) store.delete(name);
    return true;
  } catch {
    return false;
  }
}

/** Persist a new access token from a Server Action. */
export async function setAccessTokenServer(token: string): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    (await cookies()).set(TOKEN_COOKIE, token, { path: "/", sameSite: "lax" });
    return true;
  } catch {
    return false;
  }
}

/** Persist a new refresh token from a Server Action. */
export async function setRefreshTokenServer(token: string): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    (await cookies()).set(REFRESH_TOKEN_COOKIE, token, {
      path: "/",
      sameSite: "lax",
    });
    return true;
  } catch {
    return false;
  }
}

// --- Impersonate ---

export const getAdminTokenServer = async (): Promise<string | undefined> => {
  const { cookies } = await import("next/headers");
  return (await cookies()).get(ADMIN_TOKEN_COOKIE)?.value;
};

export async function startImpersonationServer(
  impersonatedToken: string,
): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const adminToken = store.get(TOKEN_COOKIE)?.value;
    if (!adminToken) return false;

    store.set(ADMIN_TOKEN_COOKIE, adminToken, { path: "/", sameSite: "lax" });
    store.set(TOKEN_COOKIE, impersonatedToken, { path: "/", sameSite: "lax" });
    return true;
  } catch {
    return false;
  }
}

export async function stopImpersonationServer(): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const adminToken = store.get(ADMIN_TOKEN_COOKIE)?.value;
    if (!adminToken) return false;

    store.set(TOKEN_COOKIE, adminToken, { path: "/", sameSite: "lax" });
    store.delete(ADMIN_TOKEN_COOKIE);
    return true;
  } catch {
    return false;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  return JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString("utf-8")
  );
}

export function getTokenSub(token: string): string | null {
  try {
    return (decodeJwtPayload(token).sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getTokenServer();
  return !!token;
}

export async function getServerRole(): Promise<string | null> {
  const token = await getTokenServer();
  if (!token) return null;
  try {
    return (decodeJwtPayload(token).role as string) ?? null;
  } catch {
    return null;
  }
}

export async function getServerStatus(): Promise<string | null> {
  const token = await getTokenServer();
  if (!token) return null;
  try {
    return (decodeJwtPayload(token).status as string) ?? null;
  } catch {
    return null;
  }
}

export async function getImpersonatedEmail(): Promise<string | null> {
  const token = await getTokenServer();
  const adminToken = await getAdminTokenServer();
  if (!token || !adminToken) return null;
  try {
    return (decodeJwtPayload(token).email as string) ?? null;
  } catch {
    return null;
  }
}
