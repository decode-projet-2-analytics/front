import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchApplication } from "@/lib/applicationsApi";
import ApplicationDetailNav from "@/components/applications/ApplicationDetailNav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailLayout({
  children,
  params,
}: Props) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) notFound();

  const application = await fetchApplication(applicationId);
  if (!application) notFound();

  const t = await getTranslations("Applications.detail");

  return (
    <div className="flex flex-1 flex-col px-6 py-8 max-w-5xl mx-auto w-full gap-6">
      <div className="space-y-3">
        <Link
          href="/applications"
          className="text-xs text-foreground-muted hover:text-foreground"
        >
          ← {t("backToList")}
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">{application.name}</h1>
            <p className="text-xs text-foreground-muted mt-1 font-mono">
              {application.appId}
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
        <ApplicationDetailNav applicationId={application.id} />
      </div>
      {children}
    </div>
  );
}
