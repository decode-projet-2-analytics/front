import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { fetchMe } from "@/lib/userApi";
import ProfilePersonalForm from "@/components/profile/ProfilePersonalForm";
import ProfileSecurityPanel from "@/components/profile/ProfileSecurityPanel";
import ProfileDangerZone from "@/components/profile/ProfileDangerZone";

export default async function ProfileAccountPage() {
  const [me, t, locale] = await Promise.all([
    fetchMe(),
    getTranslations("Profile"),
    getLocale(),
  ]);

  if (!me) {
    redirect({ href: "/login", locale });
  }

  const memberSince = new Date(me!.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-surface-1 p-6 space-y-4">
        <h2 className="text-sm font-medium">{t("personalTitle")}</h2>
        <ProfilePersonalForm user={me!} />
        <dl className="grid gap-2 text-xs text-foreground-muted pt-2 border-t border-border">
          <div className="flex gap-2">
            <dt>{t("fieldRole")}</dt>
            <dd>{me!.role}</dd>
          </div>
          <div className="flex gap-2">
            <dt>{t("fieldMember")}</dt>
            <dd>{memberSince}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-surface-1 p-6 space-y-4">
        <h2 className="text-sm font-medium">{t("securityTitle")}</h2>
        <ProfileSecurityPanel />
      </section>

      <section className="rounded-lg border border-error/30 bg-surface-1 p-6 space-y-4">
        <h2 className="text-sm font-medium text-error">{t("dangerTitle")}</h2>
        <ProfileDangerZone />
      </section>
    </div>
  );
}
