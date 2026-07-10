import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fetchApplication } from "@/lib/applicationsApi";
import { fetchTags } from "@/lib/tagsApi";
import IntegrationPanel from "@/components/applications/IntegrationPanel";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicationIntegrationPage({ params }: Props) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) notFound();

  const [application, tags, t] = await Promise.all([
    fetchApplication(applicationId),
    fetchTags(applicationId),
    getTranslations("Applications.detail.integration"),
  ]);
  if (!application) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">{t("title")}</h2>
        <p className="text-sm text-foreground-secondary mt-1">{t("subtitle")}</p>
      </div>
      <IntegrationPanel application={application} tags={tags} />
    </div>
  );
}
