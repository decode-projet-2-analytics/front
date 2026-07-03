const TOKEN_COOKIE = "accessToken";
const ADMIN_TOKEN_COOKIE = "adminToken";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const getToken = () => getCookie(TOKEN_COOKIE);

export const getTokenServer = async () => {
  const { cookies } = await import("next/headers");
  return (await cookies()).get(TOKEN_COOKIE)?.value;
};

export const setToken = (token: string) => {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
};

export const removeToken = () => {
  document.cookie = `${TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

// --- Impersonate ---

export const getAdminToken = () => getCookie(ADMIN_TOKEN_COOKIE);

export const setImpersonateToken = (impersonateToken: string) => {
  const current = getToken();
  if (current) {
    document.cookie = `${ADMIN_TOKEN_COOKIE}=${encodeURIComponent(current)}; path=/; SameSite=Lax`;
  }
  setToken(impersonateToken);
};

export const stopImpersonating = () => {
  const adminToken = getAdminToken();
  if (adminToken) setToken(adminToken);
  document.cookie = `${ADMIN_TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

export const getAdminTokenServer = async (): Promise<string | undefined> => {
  const { cookies } = await import("next/headers");
  return (await cookies()).get(ADMIN_TOKEN_COOKIE)?.value;
};

function decodeJwtPayload(token: string): Record<string, unknown> {
  return JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString("utf-8")
  );
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
