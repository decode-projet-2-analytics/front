import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchConversations, type ConversationStatus } from "@/lib/chatApi";

const STATUS_FILTERS: Array<{
  key: ConversationStatus | "all";
  label: string;
}> = [
  { key: "open", label: "filterOpen" },
  { key: "closed", label: "filterClosed" },
  { key: "all", label: "filterAll" },
];

interface Props {
  searchParams: Promise<{ status?: string }>;
}

function formatUserName(
  user:
    | { firstname: string | null; lastname: string | null; email: string }
    | null
    | undefined,
) {
  if (!user) return "—";
  const name = [user.firstname, user.lastname].filter(Boolean).join(" ");
  return name || user.email;
}

export default async function AdminSupportsPage({ searchParams }: Props) {
  const t = await getTranslations("Support.admin");
  const tHelp = await getTranslations("Support.help");
  const { status } = await searchParams;

  const statusFilter =
    status === "closed" || status === "all" ? status : ("open" as const);

  const conversations = await fetchConversations({
    all: true,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8">
      <h1 className="mb-2 text-2xl font-semibold">{t("title")}</h1>
      <p className="mb-6 text-sm text-foreground-secondary">{t("subtitle")}</p>

      <div className="mb-6 flex gap-2">
        {STATUS_FILTERS.map(({ key, label }) => {
          const active = statusFilter === key;
          const href =
            key === "open"
              ? "?"
              : key === "all"
                ? "?status=all"
                : `?status=${key}`;

          return (
            <a
              key={key}
              href={href}
              className={`rounded-full border px-4 py-1 text-sm font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border text-muted hover:bg-surface-2"
              }`}
            >
              {t(label)}
            </a>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("colId")}</th>
              <th className="px-4 py-3 font-medium">{t("colUser")}</th>
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
                  colSpan={7}
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
                    {formatUserName(conversation.user)}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {conversation.application?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {tHelp(`problemTypes.${conversation.problemType}`)}
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
                        ? tHelp("statusClosed")
                        : tHelp("statusOpen")}
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
