import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { fetchMe } from "@/lib/userApi";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const locale = await getLocale();
  const me = await fetchMe();
  if (me && me.status !== "pending" && me.status !== "rejected") {
    redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("Auth.register");

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start px-6 py-10">
      <div className="space-y-6">
        <h1 className="text-center text-2xl font-semibold">{t("title")}</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
