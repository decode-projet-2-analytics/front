"use server";

import { apiFetchServer } from "./api";
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
  createdAt: string;
  updatedAt: string;
}

export async function fetchMe(): Promise<CurrentUser | null> {
  const token = await getTokenServer();
  if (!token) return null;

  const sub = getTokenSub(token);
  if (!sub) return null;

  try {
    const res = await apiFetchServer(`/users/${sub}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
