import { getTranslations } from "next-intl/server";
import { fetchMe } from "@/lib/userApi";

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard");
  const me = await fetchMe();

  const displayName =
    [me?.firstname, me?.lastname].filter(Boolean).join(" ") ||
    me?.email ||
    "—";

  const memberSince = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex flex-1 flex-col px-6 py-8 max-w-5xl mx-auto w-full gap-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-semibold">
          {t("greeting", { name: displayName })}
        </h1>
        {me?.companyName && (
          <p className="text-sm text-foreground-secondary mt-1">{me.companyName}</p>
        )}
      </div>

      {/* Carte profil */}
      <div className="rounded-lg border border-border bg-surface-1 p-6 space-y-4">
        <h2 className="text-sm font-medium text-foreground-secondary uppercase tracking-wide">
          {t("profileTitle")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("fieldEmail")} value={me?.email} />
          <Field label={t("fieldRole")} value={me?.role} />
          <Field label={t("fieldCompany")} value={me?.companyName} />
          <Field label={t("fieldPhone")} value={me?.contactPhone} />
          <Field
            label={t("fieldWebsite")}
            value={me?.websiteUrl}
            href={me?.websiteUrl ?? undefined}
          />
          <Field label={t("fieldMember")} value={memberSince} />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-foreground-muted">{t("fieldStatus")}</span>
            {me?.status && <StatusBadge status={me.status} t={t} />}
          </div>
        </div>
      </div>

      {/* Placeholder widgets de Bastien à intégrer */}
      <div className="rounded-lg border border-dashed border-border bg-surface-0 p-8 text-center text-sm text-foreground-muted">
        {t("widgetsPlaceholder")}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-foreground-muted">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline truncate"
        >
          {value ?? "—"}
        </a>
      ) : (
        <span className="text-sm truncate">{value ?? "—"}</span>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: "pending" | "validated" | "rejected";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const styles = {
    pending: "bg-warning/10 text-warning",
    validated: "bg-success/10 text-success",
    rejected: "bg-error/10 text-error",
  };
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {t(`status_${status}`)}
    </span>
  );
}
