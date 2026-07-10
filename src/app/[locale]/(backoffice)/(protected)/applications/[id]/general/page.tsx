import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fetchApplication } from "@/lib/applicationsApi";
import ApplicationSettingsForm from "@/components/applications/ApplicationSettingsForm";
import ApplicationSecretActions from "@/components/applications/ApplicationSecretActions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicationGeneralPage({ params }: Props) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) notFound();

  const [application, t] = await Promise.all([
    fetchApplication(applicationId),
    getTranslations("Applications.detail.general"),
  ]);
  if (!application) notFound();

  const createdAt = new Date(application.createdAt).toLocaleString();
  const updatedAt = new Date(application.updatedAt).toLocaleString();

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-surface-1 p-6 space-y-4">
        <h2 className="text-sm font-medium">{t("settingsTitle")}</h2>
        <ApplicationSettingsForm application={application} />
        <dl className="grid gap-2 text-xs text-foreground-muted pt-2 border-t border-border">
          <div className="flex gap-2">
            <dt>{t("createdAt")}</dt>
            <dd>{createdAt}</dd>
          </div>
          <div className="flex gap-2">
            <dt>{t("updatedAt")}</dt>
            <dd>{updatedAt}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-surface-1 p-6 space-y-4">
        <h2 className="text-sm font-medium">{t("credentialsTitle")}</h2>
        <ApplicationSecretActions
          applicationId={application.id}
          hasSecret={application.hasSecret}
        />
      </section>
    </div>
  );
}
