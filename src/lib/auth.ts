const TOKEN_COOKIE = "accessToken";

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

export async function getServerRole(): Promise<string | null> {
  const token = await getTokenServer();
  if (!token) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf-8")
    );
    return payload.role ?? null;
  } catch {
    return null;
  }
}
