"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import AdminNavDropdown from "./AdminNavDropdown";
import Logo from "./Logo";

interface Props {
  isAdmin?: boolean;
}

const AUTH_PAGES_WITHOUT_APP_NAV = ["/login", "/register"] as const;

export default function BackofficeHeader({ isAdmin = false }: Props) {
  const t = useTranslations("Backoffice");
  const pathname = usePathname();
  const showAppNav = !AUTH_PAGES_WITHOUT_APP_NAV.includes(
    pathname as (typeof AUTH_PAGES_WITHOUT_APP_NAV)[number],
  );

  return (
    <header className="shrink-0 border-b border-border-subtle bg-surface-0">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Logo href={showAppNav ? "/dashboard" : "/"} />
        <nav className="flex items-center gap-6">
          {showAppNav && (
            <>
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
            </>
          )}
          {isAdmin && showAppNav && <AdminNavDropdown />}
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
