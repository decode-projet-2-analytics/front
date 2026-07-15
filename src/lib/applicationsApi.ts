"use server";

import { apiFetch } from "./api";
import { getTokenServer } from "./auth";

export interface Application {
  id: number;
  appId: string;
  name: string;
  allowedUrls: string[];
  hasSecret: boolean;
  ownerId: number;
  owner?: {
    id: number;
    email: string;
    firstname: string | null;
    lastname: string | null;
    companyName: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export type ApplicationTeamRole = "owner" | "admin" | "member";

export interface ApplicationTeamUser {
  id: number;
  email: string;
  firstname: string | null;
  lastname: string | null;
}

export interface ApplicationTeamMember {
  id: number | string;
  applicationId: number;
  userId: number;
  role: ApplicationTeamRole;
  status: "active" | "revoked";
  createdAt: string;
  updatedAt: string;
  user: ApplicationTeamUser;
}

export interface ApplicationInvitation {
  id: number;
  applicationId: number;
  email: string;
  role: Exclude<ApplicationTeamRole, "owner">;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InviteMembersResult {
  sent: string[];
  alreadyInvited: string[];
  alreadyMembers: string[];
  invalid: string[];
}

export type InviteMembersResponse =
  | { ok: true; data: InviteMembersResult }
  | { ok: false; status: number; message: string; details?: string };

async function readApiError(res: Response): Promise<{
  message: string;
  details?: string;
}> {
  try {
    const body = await res.json();
    return {
      message: body?.error?.message ?? `Erreur API ${res.status}`,
      details: body?.error?.details,
    };
  } catch {
    return { message: `Erreur API ${res.status}` };
  }
}

export async function fetchApplications(): Promise<Application[]> {
  const res = await apiFetch("/applications", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchApplication(
  id: number,
): Promise<Application | null> {
  const res = await apiFetch(`/applications/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function createApplication(data: {
  name: string;
  allowedUrls: string[];
}): Promise<Application | null> {
  const res = await apiFetch("/applications", {
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
  const res = await apiFetch(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function deleteApplication(id: number): Promise<boolean> {
  const res = await apiFetch(`/applications/${id}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function generateApplicationSecret(
  applicationId: number,
): Promise<{ appSecret: string } | null> {
  const res = await apiFetch(`/applications/${applicationId}/secret`, {
    method: "POST",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function revokeApplicationSecret(
  applicationId: number,
): Promise<{ ok: boolean }> {
  const res = await apiFetch(`/applications/${applicationId}/secret`, {
    method: "DELETE",
  });
  return { ok: res.ok };
}

export async function fetchApplicationTeam(
  applicationId: number,
): Promise<ApplicationTeamMember[]> {
  const token = await getTokenServer();
  if (!token) return [];

  const res = await apiFetch(`/applications/${applicationId}/team`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchApplicationRole(
  applicationId: number,
): Promise<ApplicationTeamRole | null> {
  const token = await getTokenServer();
  if (!token) return null;

  const res = await apiFetch(`/applications/${applicationId}/role`, {
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { role?: ApplicationTeamRole };
  return data.role ?? null;
}

export async function fetchApplicationInvitations(
  applicationId: number,
): Promise<ApplicationInvitation[]> {
  const token = await getTokenServer();
  if (!token) return [];

  const res = await apiFetch(`/applications/${applicationId}/invitations`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function inviteApplicationMembers(
  applicationId: number,
  data: { emails: string[]; role: Exclude<ApplicationTeamRole, "owner"> },
): Promise<InviteMembersResponse> {
  const token = await getTokenServer();
  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "Session expirée. Reconnectez-vous.",
    };
  }

  const res = await apiFetch(`/applications/${applicationId}/invitations`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await readApiError(res);
    return {
      ok: false,
      status: res.status,
      message: error.message,
      details: error.details,
    };
  }
  return { ok: true, data: await res.json() };
}

export async function updateApplicationMemberRole(
  applicationId: number,
  memberId: number,
  role: Exclude<ApplicationTeamRole, "owner">,
): Promise<{ ok: boolean }> {
  const token = await getTokenServer();
  if (!token) return { ok: false };

  const res = await apiFetch(
    `/applications/${applicationId}/members/${memberId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
  return { ok: res.ok };
}

export async function removeApplicationMember(
  applicationId: number,
  memberId: number,
): Promise<{ ok: boolean }> {
  const token = await getTokenServer();
  if (!token) return { ok: false };

  const res = await apiFetch(
    `/applications/${applicationId}/members/${memberId}`,
    { method: "DELETE" },
  );
  return { ok: res.ok };
}

export async function cancelApplicationInvitation(
  applicationId: number,
  invitationId: number,
): Promise<{ ok: boolean }> {
  const token = await getTokenServer();
  if (!token) return { ok: false };

  const res = await apiFetch(
    `/applications/${applicationId}/invitations/${invitationId}`,
    { method: "DELETE" },
  );
  return { ok: res.ok };
}

export async function acceptTeamInvitation(
  token: string,
): Promise<{
  ok: boolean;
  applicationId?: number;
  status?: number;
  message?: string;
}> {
  const authToken = await getTokenServer();
  if (!authToken) {
    return {
      ok: false,
      status: 401,
      message: "Session expirée. Reconnectez-vous.",
    };
  }

  const res = await apiFetch(`/team-invitations/${token}/accept`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await readApiError(res);
    return { ok: false, status: res.status, message: error.message };
  }
  const data = await res.json();
  return { ok: true, applicationId: data.applicationId };
}
