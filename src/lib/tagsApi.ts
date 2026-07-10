"use server";

import { apiFetchServer } from "./api";

export interface Tag {
  id: number;
  slug: string;
  comment: string;
  applicationId: number;
  createdAt: string;
  updatedAt: string;
}

export async function fetchTags(applicationId: number): Promise<Tag[]> {
  const params = new URLSearchParams({
    applicationId: String(applicationId),
  });
  const res = await apiFetchServer(`/tags?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createTag(data: {
  slug: string;
  comment?: string;
  applicationId: number;
}): Promise<Tag | null> {
  const res = await apiFetchServer("/tags", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateTag(
  id: number,
  data: { comment: string },
): Promise<Tag | null> {
  const res = await apiFetchServer(`/tags/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function archiveTag(id: number): Promise<{ ok: boolean }> {
  const res = await apiFetchServer(`/tags/${id}`, { method: "DELETE" });
  return { ok: res.ok };
}
