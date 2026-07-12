"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { DraggableAttributes } from "@dnd-kit/core";
import { deleteWidget, type Widget } from "@/lib/dashboardApi";
import KpiWidget from "./widgets/KpiWidget";
import TimeseriesWidget from "./widgets/TimeseriesWidget";
import HeatmapWidget from "./widgets/HeatmapWidget";
import MouseHeatmapWidget from "./widgets/MouseHeatmapWidget";
import EditWidgetTitleModal from "./builder/EditWidgetTitleModal";
import WidgetConfigModal from "./builder/WidgetConfigModal";

interface Props {
  widget: Widget;
  refreshKey?: number;
  canManageWidget: boolean;
  reordering?: boolean;
  isDragging?: boolean;
  dragHandleProps?: DraggableAttributes & Record<string, unknown>;
  onDeleted: () => void;
  onUpdated: () => void;
}

function WidgetContent({
  widget,
  refreshKey,
}: {
  widget: Widget;
  refreshKey: number;
}) {
  switch (widget.type) {
    case "kpi":
      return <KpiWidget widget={widget} refreshKey={refreshKey} />;
    case "timeseries":
      return <TimeseriesWidget widget={widget} refreshKey={refreshKey} />;
    case "heatmap":
      return <HeatmapWidget widget={widget} refreshKey={refreshKey} />;
    case "mouse_heatmap":
      return <MouseHeatmapWidget widget={widget} refreshKey={refreshKey} />;
  }
}

export default function WidgetCard({
  widget,
  refreshKey = 0,
  canManageWidget,
  reordering = false,
  isDragging = false,
  dragHandleProps,
  onDeleted,
  onUpdated,
}: Props) {
  const t = useTranslations("Dashboard");
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editTitleOpen, setEditTitleOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleDelete() {
    if (!window.confirm(t("deleteConfirm"))) return;

    startTransition(async () => {
      const ok = await deleteWidget(widget.id);
      if (ok) {
        onDeleted();
      } else {
        window.alert(t("deleteError"));
      }
    });
  }

  return (
    <>
      <article
        className={`group flex flex-col rounded-lg border border-border-subtle bg-surface-1 p-4 ${
          isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
        }`}
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            {dragHandleProps && (
              <button
                type="button"
                disabled={reordering}
                aria-label={t("dragWidget")}
                title={t("dragWidgetHint")}
                className="mt-0.5 shrink-0 cursor-grab rounded p-1 text-foreground-muted touch-none hover:bg-surface-2 hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
                {...dragHandleProps}
              >
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
                  aria-hidden
                >
                  <circle cx="9" cy="5" r="1" />
                  <circle cx="9" cy="12" r="1" />
                  <circle cx="9" cy="19" r="1" />
                  <circle cx="15" cy="5" r="1" />
                  <circle cx="15" cy="12" r="1" />
                  <circle cx="15" cy="19" r="1" />
                </svg>
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-medium leading-snug">{widget.title}</h2>
              <span className="mt-1.5 inline-block rounded-full bg-surface-2 px-2 py-0.5 text-xs text-foreground-muted">
                {t(`type_${widget.type}`)}
              </span>
            </div>
          </div>

          {canManageWidget && (
          <div className="flex shrink-0 items-center gap-1">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={t("widgetOptions")}
                className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-2 hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-surface-1 py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfigOpen(true);
                    }}
                    className="flex w-full px-3 py-2 text-left text-sm hover:bg-surface-2"
                  >
                    {t("configure")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setEditTitleOpen(true);
                    }}
                    className="flex w-full px-3 py-2 text-left text-sm hover:bg-surface-2"
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isPending}
                    onClick={() => {
                      setMenuOpen(false);
                      handleDelete();
                    }}
                    className="flex w-full px-3 py-2 text-left text-sm text-error hover:bg-error/10 disabled:opacity-50"
                  >
                    {t("delete")}
                  </button>
                </div>
              )}
            </div>
          </div>
          )}
        </header>

        <WidgetContent widget={widget} refreshKey={refreshKey} />
      </article>

      {canManageWidget && (
        <>
          <EditWidgetTitleModal
            open={editTitleOpen}
            widget={widget}
            onClose={() => setEditTitleOpen(false)}
            onUpdated={onUpdated}
          />

          <WidgetConfigModal
            open={configOpen}
            widget={widget}
            onClose={() => setConfigOpen(false)}
            onUpdated={onUpdated}
          />
        </>
      )}
    </>
  );
}
