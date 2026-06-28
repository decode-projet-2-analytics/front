"use client";

import { useTranslations } from "next-intl";

const steps = ["integrate", "configure", "analyze"] as const;

export default function HowItWorks() {
  const t = useTranslations("Landing.howItWorks");

  return (
    <section id="how-it-works" className="border-t border-border-subtle py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-4 text-foreground-secondary">{t("subtitle")}</p>
        </div>

        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          <div className="absolute top-8 right-[16.67%] left-[16.67%] hidden h-px bg-border md:block" />

          {steps.map((step, index) => (
            <div key={step} className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface-1 text-lg font-semibold text-primary">
                {index + 1}
              </div>
              <h3 className="mt-5 text-base font-semibold">
                {t(`steps.${step}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {t(`steps.${step}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
