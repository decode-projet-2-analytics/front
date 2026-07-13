import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { fetchMe } from "@/lib/userApi";
import ProfileDetailNav from "@/components/profile/ProfileDetailNav";

interface Props {
  children: React.ReactNode;
}

const STATUS_CLASS: Record<string, string> = {
  validated: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  rejected: "bg-error/10 text-error",
};

export default async function ProfileLayout({ children }: Props) {
  const [me, t, locale] = await Promise.all([
    fetchMe(),
    getTranslations("Profile"),
    getLocale(),
  ]);

  if (!me) {
    redirect({ href: "/login", locale });
  }

  const displayName =
    [me!.firstname, me!.lastname].filter(Boolean).join(" ") || me!.email;

  return (
    <div className="flex flex-1 flex-col px-6 py-8 max-w-5xl mx-auto w-full gap-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-foreground-secondary mt-1">
              {displayName}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              STATUS_CLASS[me!.status] ?? "bg-surface-2 text-foreground-muted"
            }`}
          >
            {t(`status_${me!.status}`)}
          </span>
        </div>
        <p className="text-sm text-foreground-muted">{t("subtitle")}</p>
        <ProfileDetailNav />
      </div>
      {children}
    </div>
  );
}
