import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fetchApplication, fetchApplicationRole } from "@/lib/applicationsApi";
import { fetchTags } from "@/lib/tagsApi";
import TagTable from "@/components/applications/TagTable";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicationTagsPage({ params }: Props) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) notFound();

  const [application, role, tags, t] = await Promise.all([
    fetchApplication(applicationId),
    fetchApplicationRole(applicationId),
    fetchTags(applicationId),
    getTranslations("Applications.detail.tags"),
  ]);
  if (!application || !role) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">{t("title")}</h2>
        <p className="text-sm text-foreground-secondary mt-1">{t("subtitle")}</p>
      </div>
      <TagTable
        applicationId={application.id}
        tags={tags}
        canManage={role === "owner" || role === "admin"}
      />
    </div>
  );
}
