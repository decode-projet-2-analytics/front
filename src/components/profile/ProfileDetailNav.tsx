"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const TABS = [
  { key: "account", href: "/profile/account" },
  { key: "company", href: "/profile/company" },
] as const;

export default function ProfileDetailNav() {
  const t = useTranslations("Profile.tabs");
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? "border-primary text-foreground"
                : "border-transparent text-foreground-muted hover:text-foreground hover:border-border"
            }`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
