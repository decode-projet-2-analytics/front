"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const localeLabels: Record<string, string> = {
  fr: "FR",
  en: "EN",
};

export default function LocaleSwitcher() {
  const t = useTranslations("Common");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <span className="sr-only">{t("language")}</span>
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            l === locale
              ? "bg-primary-muted text-primary"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          {localeLabels[l] ?? l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
