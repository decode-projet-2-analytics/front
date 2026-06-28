"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";

export default function LandingHeader() {
  const t = useTranslations("Landing");

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border-subtle bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Logo href="/" />

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-foreground-secondary transition-colors hover:text-foreground"
          >
            {t("nav.features")}
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-foreground-secondary transition-colors hover:text-foreground"
          >
            {t("nav.howItWorks")}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-foreground-secondary transition-colors hover:text-foreground sm:inline"
          >
            {t("nav.login")}
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            {t("nav.getStarted")}
          </Link>
        </div>
      </div>
    </header>
  );
}
