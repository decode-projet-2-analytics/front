import { getTranslations } from "next-intl/server";
import { fetchApplications } from "@/lib/applicationsApi";
import { fetchConversations } from "@/lib/chatApi";
import HelpPanel from "@/components/support/HelpPanel";

export default async function HelpPage() {
  const t = await getTranslations("Support");
  const [applications, conversations] = await Promise.all([
    fetchApplications(),
    fetchConversations(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8">
      <h1 className="mb-2 text-2xl font-semibold">{t("title")}</h1>
      <p className="mb-6 text-sm text-foreground-secondary">{t("subtitle")}</p>
      <HelpPanel applications={applications} conversations={conversations} />
    </div>
  );
}
