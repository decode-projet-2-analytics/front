"use client";

import { useTranslations } from "next-intl";
import Logo from "./Logo";
import LocaleSwitcher from "./LocaleSwitcher";

export default function LandingFooter() {
  const t = useTranslations("Landing.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <Logo href="/" size="sm" />
        <LocaleSwitcher />
        <p className="text-sm text-foreground-muted">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
