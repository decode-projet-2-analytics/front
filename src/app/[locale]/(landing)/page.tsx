import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getTokenServer } from "@/lib/auth";
import DashboardPreview from "@/components/landing/DashboardPreview";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";

export default async function LandingPage() {
  const t = await getTranslations("Landing");
  const token = await getTokenServer();
  const isAuthenticated = !!token;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <section className="relative px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-1 px-3 py-1 text-xs text-foreground-secondary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {t("hero.badge")}
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground-secondary text-pretty">
              {t("hero.subtitle")}
            </p>

            {!isAuthenticated && (
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover sm:w-auto"
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 w-full items-center justify-center rounded-md border border-border bg-surface-1 px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 sm:w-auto"
                >
                  {t("hero.ctaSecondary")}
                </Link>
              </div>
            )}
          </div>

          <div className="relative mt-16 sm:mt-20">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <Features />
      <HowItWorks />
      {!isAuthenticated && (
        <section className="relative border-t border-border-subtle px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("cta.title")}
            </h2>
            <p className="mt-4 text-foreground-secondary">{t("cta.subtitle")}</p>

            <Link
              href="/register"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              {t("cta.button")}
            </Link>
          </div>
        </section>
      )}

    </div>
  );
}
