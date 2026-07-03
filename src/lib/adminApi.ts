"use server";

import { getTokenServer } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export type UserStatus = "pending" | "validated" | "rejected";

export interface AdminUser {
  id: number;
  email: string;
  firstname: string | null;
  lastname: string | null;
  companyName: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  role: "Admin" | "Webmaster";
  status: UserStatus;
  createdAt: string;
}

export async function fetchAdminUsers(status?: UserStatus): Promise<AdminUser[]> {
  const token = await getTokenServer();

  const url = new URL(`${BASE_URL}/admin/users`);
  if (status) url.searchParams.set("status", status);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`fetchAdminUsers failed: ${res.status} ${res.statusText}`);
    return [];
  }
  return res.json();
}

export async function impersonateUser(
  userId: number
): Promise<{ token: string } | null> {
  const token = await getTokenServer();

  const res = await fetch(`${BASE_URL}/admin/impersonate/${userId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return res.json();
}

export async function updateUserStatus(
  userId: number,
  status: UserStatus,
  reason?: string
): Promise<{ ok: boolean }> {
  const token = await getTokenServer();

  const res = await fetch(`${BASE_URL}/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
  });

  return { ok: res.ok };
}
