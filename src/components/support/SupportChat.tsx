"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Conversation, ConversationStatus, Message } from "@/lib/chatApi";
import { useSocket } from "@/hooks/useSocket";
import { usePeerAvailability } from "@/hooks/usePeerAvailability";
import SupportConversationAdminPanel from "@/components/support/SupportConversationAdminPanel";

const CHAT_NAMESPACE = "/chat";

const EVENTS = {
  READY: "chat:ready",
  CONVERSATION_JOIN: "conversation:join",
  CONVERSATION_LEAVE: "conversation:leave",
  CONVERSATION_STATUS: "conversation:status",
  MESSAGE_SEND: "message:send",
  MESSAGE_NEW: "message:new",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
} as const;

interface Props {
  conversation: Conversation;
  initialMessages: Message[];
  currentUserId: number;
  currentUserRole: "Admin" | "Webmaster";
}

export default function SupportChat({
  conversation,
  initialMessages,
  currentUserId,
  currentUserRole,
}: Props) {
  const t = useTranslations("Support.chat");
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<ConversationStatus>(conversation.status);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [typingUserIds, setTypingUserIds] = useState<number[]>([]);

  const { socket, connectionState } = useSocket(CHAT_NAMESPACE);
  const backHref = "/help";
  const isClosed = status === "closed";

  const peerAvailable = usePeerAvailability(
    currentUserRole === "Admin" ? conversation.userId : null,
  );

  useEffect(() => {
    setMessages(initialMessages);
    setStatus(conversation.status);
  }, [conversation.conversationId, initialMessages, conversation.status]);

  useEffect(() => {
    if (!socket) return;

    const activeSocket = socket;
    const { conversationId } = conversation;

    function joinConversation() {
      activeSocket.emit(EVENTS.CONVERSATION_JOIN, { conversationId });
    }

    function onMessageNew(message: Message) {
      if (message.conversationId !== conversationId) return;
      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) return current;
        return [...current, message];
      });
    }

    function onTypingStart({
      conversationId: id,
      userId,
    }: {
      conversationId: string;
      userId: number;
    }) {
      if (id !== conversationId || userId === currentUserId) return;
      setTypingUserIds((current) =>
        current.includes(userId) ? current : [...current, userId],
      );
    }

    function onTypingStop({
      conversationId: id,
      userId,
    }: {
      conversationId: string;
      userId: number;
    }) {
      if (id !== conversationId) return;
      setTypingUserIds((current) =>
        current.filter((value) => value !== userId),
      );
    }

    function onConversationStatus({
      conversationId: id,
      status: nextStatus,
    }: {
      conversationId: string;
      status: ConversationStatus;
    }) {
      if (id !== conversationId) return;
      setStatus(nextStatus);
    }

    joinConversation();
    activeSocket.on(EVENTS.READY, joinConversation);
    activeSocket.on(EVENTS.MESSAGE_NEW, onMessageNew);
    activeSocket.on(EVENTS.TYPING_START, onTypingStart);
    activeSocket.on(EVENTS.TYPING_STOP, onTypingStop);
    activeSocket.on(EVENTS.CONVERSATION_STATUS, onConversationStatus);

    return () => {
      activeSocket.emit(EVENTS.CONVERSATION_LEAVE, { conversationId });
      activeSocket.off(EVENTS.READY, joinConversation);
      activeSocket.off(EVENTS.MESSAGE_NEW, onMessageNew);
      activeSocket.off(EVENTS.TYPING_START, onTypingStart);
      activeSocket.off(EVENTS.TYPING_STOP, onTypingStop);
      activeSocket.off(EVENTS.CONVERSATION_STATUS, onConversationStatus);
    };
  }, [socket, conversation.conversationId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUserIds]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket?.connected || !content.trim() || isClosed) return;
      socket.emit(EVENTS.MESSAGE_SEND, {
        conversationId: conversation.conversationId,
        content: content.trim(),
      });
    },
    [socket, conversation.conversationId, isClosed],
  );

  const notifyTyping = useCallback(() => {
    if (!socket?.connected || isClosed) return;

    socket.emit(EVENTS.TYPING_START, {
      conversationId: conversation.conversationId,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(EVENTS.TYPING_STOP, {
        conversationId: conversation.conversationId,
      });
    }, 2000);
  }, [socket, conversation.conversationId, isClosed]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim() || isClosed) return;
    sendMessage(draft);
    setDraft("");
  }

  const peerStatusLabel =
    currentUserRole === "Admin"
      ? peerAvailable
        ? t("userOnline")
        : t("userOffline")
      : peerAvailable
        ? t("supportOnline")
        : t("supportOffline");

  const chatPanel = (
    <div className="flex h-[min(70vh,640px)] flex-col rounded-lg border border-border bg-surface-1">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <Link
            href={backHref}
            className="text-xs text-foreground-muted transition-colors hover:text-foreground"
          >
            ← {t("back")}
          </Link>
          <p className="truncate font-mono text-sm text-foreground">
            {`"` + t(`problemTypes.${conversation.problemType}`) + `"`}
          </p>
          <p className="truncate text-xs text-foreground-secondary">
            {(conversation.application?.name ?? t("unknownApp")) +
              " - " +
              (conversation.user?.email ?? t("unknownUser"))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              isClosed
                ? "bg-foreground-muted/10 text-foreground-muted"
                : "bg-success/10 text-success"
            }`}
          >
            {isClosed ? t("statusClosed") : t("statusOpen")}
          </span>
          <span
            className={`h-2 w-2 rounded-full ${
              connectionState === "connected"
                ? "bg-success"
                : connectionState === "connecting"
                  ? "bg-warning animate-pulse"
                  : "bg-error"
            }`}
            title={t(`connection.${connectionState}`)}
          />
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              peerAvailable
                ? "bg-success/10 text-success"
                : "bg-foreground-muted/10 text-foreground-muted"
            }`}
          >
            {peerStatusLabel}
          </span>
        </div>
      </header>

      {isClosed && (
        <div className="border-b border-border bg-foreground-muted/5 px-4 py-2 text-center text-sm text-foreground-muted">
          {t("closedBanner")}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-foreground-muted">
            {t("empty")}
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === currentUserId;
            const senderLabel = isMine
              ? t("you")
              : (message.senderFirstname ?? t("unknownUser"));

            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    isMine
                      ? "bg-primary text-white"
                      : "bg-surface-2 text-foreground"
                  }`}
                >
                  <p className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
                    {senderLabel}
                  </p>
                  <p>{message.content}</p>
                </div>
              </div>
            );
          })
        )}
        {typingUserIds.length > 0 && (
          <p className="text-xs text-foreground-muted">{t("typing")}</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              notifyTyping();
            }}
            placeholder={isClosed ? t("closedPlaceholder") : t("placeholder")}
            disabled={connectionState !== "connected" || isClosed}
            className="flex-1 rounded-md border border-border bg-surface-0 px-3 py-2 text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={
              connectionState !== "connected" || !draft.trim() || isClosed
            }
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {t("send")}
          </button>
        </div>
      </form>
    </div>
  );

  if (currentUserRole !== "Admin") {
    return chatPanel;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <SupportConversationAdminPanel
        conversation={{ ...conversation, status }}
      />
      {chatPanel}
    </div>
  );
}
