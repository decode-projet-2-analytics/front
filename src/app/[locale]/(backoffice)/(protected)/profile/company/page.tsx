import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { fetchMe } from "@/lib/userApi";
import ProfileCompanyForm from "@/components/profile/ProfileCompanyForm";

export default async function ProfileCompanyPage() {
  const [me, t, locale] = await Promise.all([
    fetchMe(),
    getTranslations("Profile"),
    getLocale(),
  ]);

  if (!me) {
    redirect({ href: "/login", locale });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-surface-1 p-6 space-y-4">
        <h2 className="text-sm font-medium">{t("companyTitle")}</h2>
        <ProfileCompanyForm user={me!} />
      </section>
    </div>
  );
}
