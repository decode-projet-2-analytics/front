"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import AdminNavDropdown from "./AdminNavDropdown";
import Logo from "./Logo";

interface Props {
  isAdmin?: boolean;
}

export default function BackofficeHeader({ isAdmin = false }: Props) {
  const t = useTranslations("Backoffice");

  return (
    <header className="border-b border-border-subtle bg-surface-0">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Logo href="/dashboard" />
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-foreground-secondary transition-colors hover:text-foreground"
          >
            {t("nav.dashboard")}
          </Link>
          <Link
            href="/applications"
            className="text-sm text-foreground-secondary transition-colors hover:text-foreground"
          >
            {t("nav.applications")}
          </Link>
          <Link
            href="/help"
            className="text-sm text-foreground-secondary transition-colors hover:text-foreground"
          >
            {t("nav.support")}
          </Link>
          {isAdmin && <AdminNavDropdown />}
          <Link
            href="/"
            className="text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            {t("nav.backToSite")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
