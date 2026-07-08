"use client";

import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Conversation, ProblemType } from "@/lib/chatApi";
import { createConversation } from "@/lib/chatApi";
import type { Application } from "@/lib/applicationsApi";
import SupportAvailabilityBanner from "@/components/support/SupportAvailabilityBanner";

const PROBLEM_TYPES: ProblemType[] = [
  "DATA_SEEMS_INCORRECT",
  "CANNOT_FIND_INFORMATION",
  "ACCESS_ISSUE",
  "NEED_HELP_INTEGRATION",
  "OTHER",
];

interface Props {
  applications: Application[];
  conversations: Conversation[];
}

export default function HelpPanel({ applications, conversations }: Props) {
  const t = useTranslations("Support.help");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [applicationId, setApplicationId] = useState(
    applications[0]?.id ? String(applications[0].id) : "",
  );
  const [problemType, setProblemType] = useState<ProblemType>(
    "DATA_SEEMS_INCORRECT",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!applicationId || !message.trim()) return;

    setError(false);
    startTransition(async () => {
      const created = await createConversation({
        applicationId: Number(applicationId),
        problemType,
        message: message.trim(),
      });

      if (!created) {
        setError(true);
        return;
      }

      router.push(`/help/chat/${created.conversationId}`);
    });
  }

  return (
    <div className="space-y-6">
      <SupportAvailabilityBanner />

      <form
        onSubmit={handleCreate}
        className="rounded-lg border border-border bg-surface-1 p-6"
      >
        <h2 className="mb-4 text-sm font-medium">{t("createTitle")}</h2>
        {applications.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("noApplications")}</p>
        ) : (
          <div className="space-y-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground-secondary">
                {t("application")}
              </span>
              <select
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                className="rounded-md border border-border bg-surface-0 px-3 py-2"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground-secondary">
                {t("problemType")}
              </span>
              <select
                value={problemType}
                onChange={(event) =>
                  setProblemType(event.target.value as ProblemType)
                }
                className="rounded-md border border-border bg-surface-0 px-3 py-2"
              >
                {PROBLEM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`problemTypes.${type}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground-secondary">{t("message")}</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                placeholder={t("messagePlaceholder")}
                className="rounded-md border border-border bg-surface-0 px-3 py-2"
              />
            </label>

            <button
              type="submit"
              disabled={isPending || !applicationId || !message.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPending ? t("creating") : t("createSubmit")}
            </button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-error">{t("createError")}</p>}
      </form>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("colId")}</th>
              <th className="px-4 py-3 font-medium">{t("colApp")}</th>
              <th className="px-4 py-3 font-medium">{t("colProblem")}</th>
              <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
              <th className="px-4 py-3 font-medium">{t("colUpdated")}</th>
              <th className="px-4 py-3 font-medium">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {conversations.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-foreground-muted"
                >
                  {t("noConversations")}
                </td>
              </tr>
            ) : (
              conversations.map((conversation) => (
                <tr key={conversation.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    {conversation.conversationId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {conversation.application?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {t(`problemTypes.${conversation.problemType}`)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        conversation.status === "closed"
                          ? "bg-foreground-muted/10 text-foreground-muted"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {conversation.status === "closed"
                        ? t("statusClosed")
                        : t("statusOpen")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">
                    {new Date(conversation.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/help/chat/${conversation.conversationId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {t("open")}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
