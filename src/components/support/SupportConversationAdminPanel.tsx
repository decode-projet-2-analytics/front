"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { Conversation } from "@/lib/chatApi";
import { closeConversation } from "@/lib/chatApi";

interface Props {
  conversation: Conversation;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div>
      <dt className="text-xs text-foreground-muted">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default function SupportConversationAdminPanel({ conversation }: Props) {
  const t = useTranslations("Support.chat.adminPanel");
  const tDashboard = useTranslations("Dashboard");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const user = conversation.user;

  function handleClose() {
    if (conversation.status === "closed") return;
    if (!window.confirm(t("closeConfirm"))) return;

    setError(false);
    startTransition(async () => {
      const updated = await closeConversation(conversation.conversationId);

      if (!updated) {
        setError(true);
        return;
      }
    });
  }

  return (
    <aside>
      {conversation.status === "open" ? (
        <button
          type="button"
          onClick={handleClose}
          disabled={isPending}
          className="w-full rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error/20 disabled:opacity-50"
        >
          {isPending ? t("closing") : t("closeTicket")}
        </button>
      ) : (
        <p className="text-sm text-foreground-muted">{t("alreadyClosed")}</p>
      )}

      {error && <p className="mt-2 text-xs text-error">{t("closeError")}</p>}
    </aside>
  );
}
