export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3008/api/v1";

export function getDefaultApplicationId(): number | null {
  const raw = process.env.NEXT_PUBLIC_DEV_APPLICATION_ID;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}
