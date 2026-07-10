import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchApplication } from "@/lib/applicationsApi";
import { fetchTags } from "@/lib/tagsApi";
import { fetchTunnels } from "@/lib/tunnelsApi";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicationOverviewPage({ params }: Props) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) notFound();

  const [application, tags, tunnels, t] = await Promise.all([
    fetchApplication(applicationId),
    fetchTags(applicationId),
    fetchTunnels(applicationId),
    getTranslations("Applications.detail.overview"),
  ]);

  if (!application) notFound();

  const checklist = [
    {
      ok: application.allowedUrls.length > 0,
      label: t("checkUrls"),
      href: `/applications/${applicationId}/general`,
    },
    {
      ok: application.hasSecret,
      label: t("checkSecret"),
      href: `/applications/${applicationId}/general`,
    },
    {
      ok: tags.length > 0,
      label: t("checkTags"),
      href: `/applications/${applicationId}/tags`,
    },
    {
      ok: tunnels.length > 0,
      label: t("checkTunnels"),
      href: `/applications/${applicationId}/tunnels`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">{t("title")}</h2>
        <p className="text-sm text-foreground-secondary mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface-1 p-4">
          <p className="text-xs text-foreground-muted">{t("tagsLabel")}</p>
          <p className="text-2xl font-semibold mt-1">{tags.length}</p>
          <Link
            href={`/applications/${applicationId}/tags`}
            className="text-xs text-primary hover:underline mt-2 inline-block"
          >
            {t("manageTags")}
          </Link>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 p-4">
          <p className="text-xs text-foreground-muted">{t("tunnelsLabel")}</p>
          <p className="text-2xl font-semibold mt-1">{tunnels.length}</p>
          <Link
            href={`/applications/${applicationId}/tunnels`}
            className="text-xs text-primary hover:underline mt-2 inline-block"
          >
            {t("manageTunnels")}
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-surface-1 p-4 space-y-3">
        <h3 className="text-sm font-medium">{t("checklistTitle")}</h3>
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  item.ok
                    ? "bg-success/15 text-success"
                    : "bg-warning/15 text-warning"
                }`}
              >
                {item.ok ? "✓" : "!"}
              </span>
              <Link href={item.href} className="hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/applications/${applicationId}/integration`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          {t("openIntegration")}
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
        >
          {t("openDashboard")}
        </Link>
      </div>
    </div>
  );
}
