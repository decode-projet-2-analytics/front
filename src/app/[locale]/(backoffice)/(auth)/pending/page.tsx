import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { fetchMe } from "@/lib/userApi";
import { Link } from "@/i18n/navigation";

export default async function PendingPage() {
  const [t, locale, me] = await Promise.all([
    getTranslations("Auth.pending"),
    getLocale(),
    fetchMe(),
  ]);

  if (me && me.status !== "pending") {
    redirect({ href: "/dashboard", locale });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-foreground-secondary">{t("subtitle")}</p>
        </div>

        <div className="rounded-lg border border-border bg-surface-2 px-6 py-4 text-left space-y-2">
          <p className="text-sm font-medium">{t("nextSteps")}</p>
          <ul className="space-y-1 text-sm text-foreground-secondary">
            <li>· {t("step1")}</li>
            <li>· {t("step2")}</li>
            <li>· {t("step3")}</li>
          </ul>
        </div>

        <p className="text-xs text-foreground-muted">{t("emailHint")}</p>

        <Link
          href="/login"
          className="inline-block text-sm text-primary hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
