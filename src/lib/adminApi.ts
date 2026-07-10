"use server";

import { apiFetch } from "./api";

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
  const path =
    status !== undefined ? `/admin/users?status=${status}` : "/admin/users";

  const res = await apiFetch(path, { cache: "no-store" });

  if (!res.ok) {
    console.error(`fetchAdminUsers failed: ${res.status} ${res.statusText}`);
    return [];
  }
  return res.json();
}

export async function impersonateUser(
  userId: number
): Promise<{ token: string } | null> {
  const res = await apiFetch(`/admin/impersonate/${userId}`, {
    method: "POST",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateUserStatus(
  userId: number,
  status: UserStatus,
  reason?: string
): Promise<{ ok: boolean }> {
  const res = await apiFetch(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
  });
  return { ok: res.ok };
}
