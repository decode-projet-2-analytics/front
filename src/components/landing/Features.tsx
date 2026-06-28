"use client";

import { useTranslations } from "next-intl";

const icons = {
  kpi: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  realtime: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  heatmap: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  ),
  sdk: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  ),
};

const featureKeys = ["kpi", "realtime", "heatmap", "sdk"] as const;

export default function Features() {
  const t = useTranslations("Landing.features");

  return (
    <section id="features" className="border-t border-border-subtle py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-4 text-foreground-secondary">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {featureKeys.map((key) => (
            <div
              key={key}
              className="group rounded-xl border border-border bg-surface-1 p-6 transition-colors hover:border-primary/30 hover:bg-surface-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary transition-colors group-hover:bg-primary/25">
                {icons[key]}
              </div>
              <h3 className="mt-4 text-base font-semibold">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {t(`items.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
