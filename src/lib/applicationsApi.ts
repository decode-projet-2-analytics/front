"use server";

import { apiFetchServer } from "./api";

export interface Application {
  id: number;
  appId: string;
  name: string;
  allowedUrls: string[];
  hasSecret: boolean;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export async function fetchApplications(): Promise<Application[]> {
  const res = await apiFetchServer("/applications", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchApplication(
  id: number,
): Promise<Application | null> {
  const res = await apiFetchServer(`/applications/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function createApplication(data: {
  name: string;
  allowedUrls: string[];
}): Promise<Application | null> {
  const res = await apiFetchServer("/applications", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateApplication(
  id: number,
  data: { name?: string; allowedUrls?: string[] },
): Promise<Application | null> {
  const res = await apiFetchServer(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateApplicationSecret(
  applicationId: number,
): Promise<{ appSecret: string } | null> {
  const res = await apiFetchServer(`/applications/${applicationId}/secret`, {
    method: "POST",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function revokeApplicationSecret(
  applicationId: number,
): Promise<{ ok: boolean }> {
  const res = await apiFetchServer(`/applications/${applicationId}/secret`, {
    method: "DELETE",
  });
  return { ok: res.ok };
}
