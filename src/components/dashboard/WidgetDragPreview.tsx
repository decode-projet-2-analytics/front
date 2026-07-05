"use client";

import { useTranslations } from "next-intl";
import type { Widget } from "@/lib/dashboardApi";

interface Props {
  widget: Widget;
}

export default function WidgetDragPreview({ widget }: Props) {
  const t = useTranslations("Dashboard");

  return (
    <article className="flex cursor-grabbing items-center gap-3 rounded-lg border border-border-subtle bg-surface-1 p-4 shadow-xl ring-2 ring-primary/30">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-foreground-muted"
        aria-hidden
      >
        <circle cx="9" cy="5" r="1" />
        <circle cx="9" cy="12" r="1" />
        <circle cx="9" cy="19" r="1" />
        <circle cx="15" cy="5" r="1" />
        <circle cx="15" cy="12" r="1" />
        <circle cx="15" cy="19" r="1" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-snug">{widget.title}</p>
        <span className="mt-1 inline-block rounded-full bg-surface-2 px-2 py-0.5 text-xs text-foreground-muted">
          {t(`type_${widget.type}`)}
        </span>
      </div>
    </article>
  );
}
