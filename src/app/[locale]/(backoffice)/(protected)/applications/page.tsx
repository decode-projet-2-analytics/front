import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchApplications } from "@/lib/applicationsApi";
import { fetchMe } from "@/lib/userApi";
import CreateApplicationForm from "@/components/applications/CreateApplicationForm";
import { fetchTags } from "@/lib/tagsApi";
import { fetchTunnels } from "@/lib/tunnelsApi";
import { getServerRole } from "@/lib/auth";

export default async function ApplicationsPage() {
  const [t, globalRole, applications] = await Promise.all([
    getTranslations("Applications"),
    getServerRole(),
    fetchApplications(),
  ]);

  if (globalRole === "Admin") {
    return (
      <div className="flex flex-1 flex-col px-6 py-8 max-w-5xl mx-auto w-full gap-6">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-foreground-secondary mt-1">
            {t("adminInventorySubtitle")}
          </p>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("noApplications")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("name")}</th>
                  <th className="px-4 py-3 font-medium">{t("appId")}</th>
                  <th className="px-4 py-3 font-medium">{t("owner")}</th>
                  <th className="px-4 py-3 font-medium">{t("createdAt")}</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => {
                  const ownerName = [application.owner?.firstname, application.owner?.lastname]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <tr key={application.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{application.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{application.appId}</td>
                      <td className="px-4 py-3">
                        <span className="block">{ownerName || application.owner?.companyName || "—"}</span>
                        <span className="text-xs text-foreground-muted">{application.owner?.email}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">
                        {new Date(application.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  const me = await fetchMe();

  const counts = await Promise.all(
    applications.map(async (application) => {
      const [tags, tunnels] = await Promise.all([
        fetchTags(application.id),
        fetchTunnels(application.id),
      ]);

      return {
        id: application.id,
        tagCount: tags.length,
        tunnelCount: tunnels.length,
      };
    }),
  );

  const countById = new Map(counts.map((c) => [c.id, c]));
  const canCreateApplication =
    applications.length === 0 ||
    applications.some((application) => application.ownerId === me?.id);

  return (
    <div className="flex flex-1 flex-col px-6 py-8 max-w-5xl mx-auto w-full gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-foreground-secondary mt-1">
          {t("subtitle")}
        </p>
      </div>

      {applications.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t("noApplications")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {applications.map((application) => {
            const count = countById.get(application.id);

            return (
              <div
                key={application.id}
                className="rounded-lg border border-border bg-surface-1 p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-sm font-medium">{application.name}</h2>

                    <p className="text-xs text-foreground-muted mt-1">
                      {t("appId")}:{" "}
                      <code className="font-mono">{application.appId}</code>
                    </p>

                    <p className="text-xs text-foreground-muted mt-2">
                      {t("tagCount", { count: count?.tagCount ?? 0 })}
                      {" · "}
                      {t("tunnelCount", { count: count?.tunnelCount ?? 0 })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        application.hasSecret
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {application.hasSecret
                        ? t("secretActive")
                        : t("secretMissing")}
                    </span>
                    <Link
                      href={`/applications/${application.id}`}
                      className="mb-0.5 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      {t("manageApplication")}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canCreateApplication && (
        <div className="rounded-lg border border-dashed border-border bg-surface-0 p-6">
          <h2 className="text-sm font-medium mb-4">{t("createTitle")}</h2>
          <CreateApplicationForm />
        </div>
      )}
    </div>
  );
}
