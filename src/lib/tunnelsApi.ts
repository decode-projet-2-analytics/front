"use server";

import { apiFetch } from "./api";

export interface Tunnel {
  id: number;
  tunnelId: string;
  name: string;
  tagIds: number[];
  applicationId: number;
  createdAt: string;
  updatedAt: string;
}

export async function fetchTunnels(applicationId: number): Promise<Tunnel[]> {
  const params = new URLSearchParams({
    applicationId: String(applicationId),
  });
  const res = await apiFetch(`/tunnels?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createTunnel(data: {
  name: string;
  applicationId: number;
  tagIds: number[];
}): Promise<Tunnel | null> {
  const res = await apiFetch("/tunnels", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateTunnel(
  id: number,
  data: { name?: string; tagIds?: number[] },
): Promise<Tunnel | null> {
  const res = await apiFetch(`/tunnels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function archiveTunnel(id: number): Promise<{ ok: boolean }> {
  const res = await apiFetch(`/tunnels/${id}`, { method: "DELETE" });
  return { ok: res.ok };
}
