import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  fetchApplication,
  fetchApplicationRole,
} from "@/lib/applicationsApi";
import ApplicationSettingsForm from "@/components/applications/ApplicationSettingsForm";
import ApplicationSecretActions from "@/components/applications/ApplicationSecretActions";
import ApplicationDangerZone from "@/components/applications/ApplicationDangerZone";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicationGeneralPage({ params }: Props) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) notFound();

  const [application, role, t] = await Promise.all([
    fetchApplication(applicationId),
    fetchApplicationRole(applicationId),
    getTranslations("Applications.detail.general"),
  ]);
  if (!application || !role) notFound();

  const canManageApplication = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  const createdAt = new Date(application.createdAt).toLocaleString();
  const updatedAt = new Date(application.updatedAt).toLocaleString();

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-surface-1 p-6 space-y-4">
        <h2 className="text-sm font-medium">{t("settingsTitle")}</h2>
        {canManageApplication ? (
          <ApplicationSettingsForm application={application} />
        ) : (
          <dl className="grid gap-4 text-sm">
            <div className="space-y-1">
              <dt className="font-medium text-foreground-muted">
                {t("nameLabel")}
              </dt>
              <dd>{application.name}</dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium text-foreground-muted">
                {t("urlsLabel")}
              </dt>
              <dd>
                {application.allowedUrls.length > 0 ? (
                  <ul className="space-y-1 font-mono text-xs">
                    {application.allowedUrls.map((url) => (
                      <li key={url}>{url}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-foreground-muted">—</span>
                )}
              </dd>
            </div>
          </dl>
        )}
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

      {canManageApplication && (
        <section className="rounded-lg border border-border bg-surface-1 p-6 space-y-4">
          <h2 className="text-sm font-medium">{t("credentialsTitle")}</h2>
          <ApplicationSecretActions
            applicationId={application.id}
            hasSecret={application.hasSecret}
          />
        </section>
      )}

      {isOwner && (
        <section className="rounded-lg border border-error/30 bg-surface-1 p-6 space-y-4">
          <h2 className="text-sm font-medium text-error">{t("dangerTitle")}</h2>
          <ApplicationDangerZone applicationId={application.id} />
        </section>
      )}
    </div>
  );
}
