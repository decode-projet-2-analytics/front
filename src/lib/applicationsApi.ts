"use server";

import { getTokenServer } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

  const res = await fetch(`${BASE_URL}/applications`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

export async function createApplication(data: {
  name: string;
  allowedUrls: string[];
}): Promise<Application | null> {
  const token = await getTokenServer();
  if (!token) return null;

  const res = await fetch(`${BASE_URL}/applications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) return null;
  return res.json();
}

export async function generateApplicationSecret(
  applicationId: number
): Promise<{ appSecret: string } | null> {
  const token = await getTokenServer();
  if (!token) return null;

  const res = await fetch(`${BASE_URL}/applications/${applicationId}/secret`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return res.json();
}

export async function revokeApplicationSecret(
  applicationId: number
): Promise<{ ok: boolean }> {
  const token = await getTokenServer();
  if (!token) return { ok: false };

  const res = await fetch(`${BASE_URL}/applications/${applicationId}/secret`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  return { ok: res.ok };
}
