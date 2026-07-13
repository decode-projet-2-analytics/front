import { getLocale, getTranslations } from "next-intl/server";
import {
  fetchApplicationRole,
  fetchApplications,
  type ApplicationTeamRole,
} from "@/lib/applicationsApi";
import { getDefaultApplicationId } from "@/lib/env";
import { fetchMe } from "@/lib/userApi";
import DashboardView from "@/components/dashboard/DashboardView";

interface Props {
  searchParams: Promise<{ applicationId?: string }>;
}

function Field({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-foreground-muted">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-accent hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="text-sm">{value}</span>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: "pending" | "validated" | "rejected";
  t: (key: string) => string;
}) {
  const styles: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    validated: "bg-success/10 text-success",
    rejected: "bg-error/10 text-error",
  };
  return (
    <span
      className={`inline-flex w-fit rounded px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {t(`status_${status}`)}
    </span>
  );
}

export default async function DashboardPage({ searchParams }: Props) {
  const [applications, params, me, t, locale] = await Promise.all([
    fetchApplications(),
    searchParams,
    fetchMe(),
    getTranslations("Dashboard"),
    getLocale(),
  ]);

  const displayName =
    [me?.firstname, me?.lastname].filter(Boolean).join(" ") ||
    me?.email ||
    "";
  const memberSince = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const requestedId = Number(params.applicationId);
  const defaultApplicationId =
    applications.find((app) => app.id === requestedId)?.id ??
    applications.find((app) => app.id === getDefaultApplicationId())?.id ??
    applications[0]?.id ??
    null;
  const applicationRoles = await Promise.all(
    applications.map(async (application) => ({
      id: application.id,
      role: await fetchApplicationRole(application.id),
    })),
  );
  const roleByApplication = Object.fromEntries(
    applicationRoles.map(({ id, role }) => [id, role]),
  ) as Record<number, ApplicationTeamRole | null>;
  const applicationRole = defaultApplicationId
    ? roleByApplication[defaultApplicationId]
    : null;

  return (
    <div className="flex flex-1 flex-col px-6 py-8 max-w-6xl mx-auto w-full gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {t("greeting", { name: displayName })}
        </h1>
        {me?.companyName && (
          <p className="text-sm text-foreground-secondary mt-1">
            {me.companyName}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface-1 p-6 space-y-4">
        <h2 className="text-sm font-medium text-foreground-secondary uppercase tracking-wide">
          {t("profileTitle")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("fieldEmail")} value={me?.email} />
          <Field
            label={t("fieldRole")}
            value={applicationRole ? t(`role_${applicationRole}`) : me?.role}
          />
          <Field label={t("fieldCompany")} value={me?.companyName} />
          <Field label={t("fieldPhone")} value={me?.contactPhone} />
          <Field
            label={t("fieldWebsite")}
            value={me?.websiteUrl}
            href={me?.websiteUrl ?? undefined}
          />
          <Field label={t("fieldMember")} value={memberSince} />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-foreground-muted">
              {t("fieldStatus")}
            </span>
            {me?.status && <StatusBadge status={me.status} t={t} />}
          </div>
        </div>
      </div>

      <DashboardView
        applications={applications}
        defaultApplicationId={defaultApplicationId}
        roleByApplication={roleByApplication}
      />
    </div>
  );
}
