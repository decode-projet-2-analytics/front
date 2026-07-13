"use server";

import { apiFetch } from "./api";

export type ConversationStatus = "open" | "closed";

export type ProblemType =
  | "DATA_SEEMS_INCORRECT"
  | "CANNOT_FIND_INFORMATION"
  | "ACCESS_ISSUE"
  | "NEED_HELP_INTEGRATION"
  | "OTHER";

export interface ConversationApplication {
  id: number;
  name: string;
  appId: string;
}

export interface ConversationUser {
  id: number;
  firstname: string | null;
  lastname: string | null;
  email: string;
  companyName: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  status: "pending" | "validated" | "rejected";
}

export interface Conversation {
  id: number;
  conversationId: string;
  applicationId: number;
  status: ConversationStatus;
  userId: number | null;
  problemType: ProblemType;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  application?: ConversationApplication;
  user?: ConversationUser | null;
}

export interface Message {
  id: number;
  conversationId: string;
  senderId: number;
  senderFirstname: string | null;
  content: string;
  createdAt: string;
}

export async function fetchConversations(params?: {
  status?: ConversationStatus;
  applicationId?: number;
  all?: boolean;
}): Promise<Conversation[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.applicationId) {
    search.set("applicationId", String(params.applicationId));
  }
  if (params?.all) search.set("all", "true");

  const qs = search.toString();
  const path = qs ? `/conversations?${qs}` : "/conversations";

  const res = await apiFetch(path, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function createConversation(data: {
  applicationId: number;
  problemType: ProblemType;
  message: string;
}): Promise<Conversation | null> {
  const res = await apiFetch("/conversations", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchConversation(
  conversationId: string,
): Promise<Conversation | null> {
  const res = await apiFetch(`/conversations/${conversationId}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const res = await apiFetch(
    `/conversations/${conversationId}/messages`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  return res.json();
}

export async function closeConversation(
  conversationId: string,
): Promise<Conversation | null> {
  const res = await apiFetch(`/conversations/${conversationId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "closed" }),
  });
  if (!res.ok) return null;
  return res.json();
}
