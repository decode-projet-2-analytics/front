"use client";

import { useTranslations } from "next-intl";
import LocaleSwitcher from "./LocaleSwitcher";

export default function BackofficeFooter() {
  const t = useTranslations("Backoffice.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border-subtle py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <p className="text-sm text-foreground-muted">
          {t("copyright", { year })}
        </p>
        <LocaleSwitcher />
      </div>
    </footer>
  );
}
