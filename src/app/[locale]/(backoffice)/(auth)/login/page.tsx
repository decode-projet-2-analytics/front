import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { fetchMe } from "@/lib/userApi";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const locale = await getLocale();
  const me = await fetchMe();
  if (me && me.status !== "pending" && me.status !== "rejected") {
    redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("Auth.login");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-semibold">{t("title")}</h1>
        <LoginForm />
      </div>
    </div>
  );
}
