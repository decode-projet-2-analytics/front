"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { DraggableAttributes } from "@dnd-kit/core";
import {
  deleteWidget,
  fetchTags,
  type BreakdownWidgetData,
  type EventsWidgetData,
  type FunnelWidgetData,
  type ScrollDepthWidgetData,
  type Tag,
  type Widget,
} from "@/lib/dashboardApi";
import {
  normalizeWidgetMetric,
  readEventsTagId,
} from "./builder/widgetConfigUtils";
import type { MouseHeatmapLiveData } from "./widgets/MouseHeatmapWidget";
import MouseHeatmapWidget from "./widgets/MouseHeatmapWidget";
import FunnelWidget from "./widgets/FunnelWidget";
import EventsWidget from "./widgets/EventsWidget";
import BreakdownWidget from "./widgets/BreakdownWidget";
import ScrollDepthWidget from "./widgets/ScrollDepthWidget";
import RetentionWidget from "./widgets/RetentionWidget";
import EditWidgetTitleModal from "./builder/EditWidgetTitleModal";
import WidgetConfigModal from "./builder/WidgetConfigModal";

interface Props {
  widget: Widget;
  refreshKey?: number;
  canManageWidget: boolean;
  reordering?: boolean;
  isDragging?: boolean;
  liveData?: unknown;
  dragHandleProps?: DraggableAttributes & Record<string, unknown>;
  onDeleted: () => void;
  onUpdated: () => void;
}

function WidgetContent({
  widget,
  refreshKey,
  liveData,
  onUpdated,
}: {
  widget: Widget;
  refreshKey: number;
  liveData: unknown;
  onUpdated: () => void;
}) {
  switch (widget.type) {
    case "events":
      return (
        <EventsWidget
          widget={widget}
          refreshKey={refreshKey}
          liveData={liveData as EventsWidgetData | null}
        />
      );
    case "mouse_heatmap":
      return (
        <MouseHeatmapWidget
          widget={widget}
          refreshKey={refreshKey}
          liveData={liveData as MouseHeatmapLiveData | null}
          onConfigPatched={onUpdated}
        />
      );
    case "funnel":
      return (
        <FunnelWidget
          widget={widget}
          refreshKey={refreshKey}
          liveData={liveData as FunnelWidgetData | null}
        />
      );
    case "breakdown":
      return (
        <BreakdownWidget
          widget={widget}
          refreshKey={refreshKey}
          liveData={liveData as BreakdownWidgetData | null}
        />
      );
    case "scroll_depth":
      return (
          <ScrollDepthWidget
              widget={widget}
              refreshKey={refreshKey}
              liveData={liveData as ScrollDepthWidgetData | null}
          />
      );
      case "retention":
      return <RetentionWidget widget={widget} refreshKey={refreshKey} />;
  }
}

export default function WidgetCard({
  widget,
  refreshKey = 0,
  canManageWidget,
  reordering = false,
  isDragging = false,
  liveData = null,
  dragHandleProps,
  onDeleted,
  onUpdated,
}: Props) {
  const t = useTranslations("Dashboard");
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [editTitleOpen, setEditTitleOpen] = useState(false);
  const [tag, setTag] = useState<Tag | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isEvents = widget.type === "events";
  const metric = normalizeWidgetMetric(widget.config?.metric);

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

  useEffect(() => {
    if (widget.type !== "events") {
      setTag(null);
      return;
    }

    const tagId = readEventsTagId(widget.config);
    if (tagId === "") {
      setTag(null);
      return;
    }

    let cancelled = false;
    fetchTags(widget.applicationId).then((tags) => {
      if (cancelled) return;
      setTag(tags.find((item) => item.id === tagId) ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [widget]);

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

  const showTypeBadge =
    widget.type === "funnel" ||
    widget.type === "mouse_heatmap" ||
    widget.type === "breakdown" ||
    widget.type === "scroll_depth";

  return (
    <>
      <article
        data-widget-card
        className={`group flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-1 p-4 ${
          isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
        }`}
      >
        <header className="widget-drag-handle mb-3 flex shrink-0 cursor-grab items-start justify-between gap-3 active:cursor-grabbing">
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
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <h2 className="truncate font-medium leading-snug">
                  {widget.title}
                </h2>
                {isEvents && tag?.slug && (
                  <span className="truncate font-mono text-xs text-foreground-muted">
                    {tag.slug}
                  </span>
                )}
                {!isEvents && showTypeBadge && (
                  <span className="truncate text-xs text-foreground-muted">
                    {t(`type_${widget.type}`)}
                  </span>
                )}
              </div>
              {isEvents && tag?.comment ? (
                <p className="mt-0.5 truncate text-xs text-foreground-secondary">
                  {tag.comment}
                </p>
              ) : null}
            </div>
          </div>

          {canManageWidget && (
          <div className="widget-actions flex shrink-0 items-center gap-1">
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
                      setEditTitleOpen(true);
                    }}
                    className="flex w-full px-3 py-2 text-left text-sm hover:bg-surface-2"
                  >
                    {t("edit")}
                  </button>
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

        <div data-widget-body className="min-h-0 flex-1 overflow-auto">
          <div data-widget-measure className="flex h-full min-h-0 flex-col">
            <WidgetContent
              widget={widget}
              refreshKey={refreshKey}
              liveData={liveData}
              onUpdated={onUpdated}
            />
          </div>
        </div>

        {isEvents && (
          <footer className="mt-3 shrink-0 border-t border-border-subtle pt-2">
            <p className="text-xs text-foreground-muted">
              {t(`metricMode_${metric}`)}
            </p>
          </footer>
        )}
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
