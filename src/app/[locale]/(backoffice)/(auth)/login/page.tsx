import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { fetchMe } from "@/lib/userApi";
import LoginForm from "@/components/auth/LoginForm";

interface Props {
  searchParams: Promise<{ redirect?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const locale = await getLocale();
  const { redirect: redirectTo } = await searchParams;
  const me = await fetchMe();
  if (me && me.status !== "pending" && me.status !== "rejected") {
    redirect({ href: getSafeRedirectPath(redirectTo), locale });
  }

  const t = await getTranslations("Auth.login");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-10">
      <div className="space-y-6">
        <h1 className="text-center text-2xl font-semibold">{t("title")}</h1>
        <LoginForm redirectTo={getSafeRedirectPath(redirectTo)} />
      </div>
    </div>
  );
}

function getSafeRedirectPath(value: string | string[] | undefined): string {
  const redirectTo = Array.isArray(value) ? value[0] : value;
  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return "/dashboard";
  }

  return redirectTo;
}
