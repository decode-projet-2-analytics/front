import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fetchApplication } from "@/lib/applicationsApi";
import { fetchTags } from "@/lib/tagsApi";
import { fetchTunnels } from "@/lib/tunnelsApi";
import TunnelList from "@/components/applications/TunnelList";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicationTunnelsPage({ params }: Props) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) notFound();

  const [application, tags, tunnels, t] = await Promise.all([
    fetchApplication(applicationId),
    fetchTags(applicationId),
    fetchTunnels(applicationId),
    getTranslations("Applications.detail.tunnels"),
  ]);
  if (!application) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">{t("title")}</h2>
        <p className="text-sm text-foreground-secondary mt-1">{t("subtitle")}</p>
      </div>
      <TunnelList
        applicationId={application.id}
        tunnels={tunnels}
        tags={tags}
      />
    </div>
  );
}
