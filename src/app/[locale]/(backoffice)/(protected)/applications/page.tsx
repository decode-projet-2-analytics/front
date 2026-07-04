import { getTranslations } from "next-intl/server";
import { fetchApplications } from "@/lib/applicationsApi";
import ApplicationSecretActions from "@/components/applications/ApplicationSecretActions";
import CreateApplicationForm from "@/components/applications/CreateApplicationForm";

export default async function ApplicationsPage() {
  const t = await getTranslations("Applications");
  const applications = await fetchApplications();

  return (
    <div className="flex flex-1 flex-col px-6 py-8 max-w-5xl mx-auto w-full gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-foreground-secondary mt-1">{t("subtitle")}</p>
      </div>

      {applications.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t("noApplications")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {applications.map((application) => (
            <div
              key={application.id}
              className="rounded-lg border border-border bg-surface-1 p-6 space-y-4"
            >F
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-sm font-medium">{application.name}</h2>
                  <p className="text-xs text-foreground-muted mt-1">
                    {t("appId")}:{" "}
                    <code className="font-mono">{application.appId}</code>
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    {t("allowedUrls")}: {application.allowedUrls.join(", ") || "—"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    application.hasSecret
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {application.hasSecret ? t("secretActive") : t("secretMissing")}
                </span>
              </div>

              <ApplicationSecretActions
                applicationId={application.id}
                hasSecret={application.hasSecret}
              />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-dashed border-border bg-surface-0 p-6">
        <h2 className="text-sm font-medium mb-4">{t("createTitle")}</h2>
        <CreateApplicationForm />
      </div>
    </div>
  );
}
