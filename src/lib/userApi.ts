"use server";

import { apiFetch } from "./api";
import { getTokenServer, getTokenSub } from "./auth";

export interface CurrentUser {
  id: number;
  firstname: string | null;
  lastname: string | null;
  email: string;
  role: "Admin" | "Webmaster";
  status: "pending" | "validated" | "rejected";
  companyName: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  kbisDocument: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchMe(): Promise<CurrentUser | null> {
  const token = await getTokenServer();
  if (!token) return null;

  const sub = getTokenSub(token);
  if (!sub) return null;

  try {
    const res = await apiFetch(`/users/${sub}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export type UpdateMeInput = {
  firstname?: string | null;
  lastname?: string | null;
  email?: string;
  contactPhone?: string | null;
  companyName?: string | null;
  websiteUrl?: string | null;
  kbisDocument?: string | null;
  password?: string;
};

export async function updateMe(
  data: UpdateMeInput,
): Promise<CurrentUser | null> {
  const token = await getTokenServer();
  if (!token) return null;

  const sub = getTokenSub(token);
  if (!sub) return null;

  const res = await apiFetch(`/users/${sub}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function deleteMe(): Promise<boolean> {
  const token = await getTokenServer();
  if (!token) return false;

  const sub = getTokenSub(token);
  if (!sub) return false;

  const res = await apiFetch(`/users/${sub}`, { method: "DELETE" });
  return res.ok;
}
