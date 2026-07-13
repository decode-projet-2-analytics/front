"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const TABS = [
  { key: "overview", href: "" },
  { key: "general", href: "/general" },
  { key: "tags", href: "/tags" },
  { key: "tunnels", href: "/tunnels" },
  { key: "integration", href: "/integration" },
] as const;

interface Props {
  applicationId: number;
}

export default function ApplicationDetailNav({ applicationId }: Props) {
  const t = useTranslations("Applications.detail.tabs");
  const pathname = usePathname();
  const base = `/applications/${applicationId}`;

  function isActive(href: string) {
    const full = `${base}${href}`;
    if (href === "") {
      return pathname === base || pathname === `${base}/`;
    }
    return pathname === full || pathname.startsWith(`${full}/`);
  }

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.key}
            href={`${base}${tab.href}`}
            className={`shrink-0 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
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
