"use server";

import { getTokenServer } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

function getSubFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf-8")
    );
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function fetchMe(): Promise<CurrentUser | null> {
  const token = await getTokenServer();
  if (!token) return null;

  const sub = getSubFromToken(token);
  if (!sub) return null;

  try {
    const res = await fetch(`${BASE_URL}/users/${sub}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
