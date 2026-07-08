"use server";

import { apiFetchServer } from "./api";
import { getTokenServer } from "./auth";

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
  const token = await getTokenServer();
  if (!token) return [];

  const res = await apiFetchServer("/applications", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function createApplication(data: {
  name: string;
  allowedUrls: string[];
}): Promise<Application | null> {
  const token = await getTokenServer();
  if (!token) return null;

  const res = await apiFetchServer("/applications", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateApplicationSecret(
  applicationId: number,
): Promise<{ appSecret: string } | null> {
  const token = await getTokenServer();
  if (!token) return null;

  const res = await apiFetchServer(`/applications/${applicationId}/secret`, {
    method: "POST",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function revokeApplicationSecret(
  applicationId: number,
): Promise<{ ok: boolean }> {
  const token = await getTokenServer();
  if (!token) return { ok: false };

  const res = await apiFetchServer(`/applications/${applicationId}/secret`, {
    method: "DELETE",
  });
  return { ok: res.ok };
}
