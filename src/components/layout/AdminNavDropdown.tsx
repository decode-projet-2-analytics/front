"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const ADMIN_LINKS = [
  { href: "/admin/users", labelKey: "nav.adminUsers" },
  { href: "/admin/supports", labelKey: "nav.adminSupports" },
] as const;

export default function AdminNavDropdown() {
  const t = useTranslations("Backoffice");
  const pathname = usePathname();
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const isAdminRoute = ADMIN_LINKS.some(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
          isAdminRoute
            ? "text-foreground"
            : "text-foreground-secondary hover:text-foreground"
        }`}
      >
        {t("nav.admin")}
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-44 rounded-md border border-border bg-surface-2 py-1 shadow-lg"
        >
          {ADMIN_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary-muted text-primary"
                    : "text-foreground-secondary hover:bg-surface-3 hover:text-foreground"
                }`}
              >
                {t(link.labelKey)}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
