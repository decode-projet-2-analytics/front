"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { fetchTags, type Tag, type Widget } from "@/lib/dashboardApi";
import { fetchTrackedPages, type TrackedPage } from "@/lib/mouseHeatmapApi";
import { fetchTunnels, type Tunnel } from "@/lib/tunnelsApi";
import {
  readMousePeriod,
  type MousePeriod,
} from "./widgetConfigUtils";
import WidgetConfigForm from "./WidgetConfigForm";

interface Props {
  open: boolean;
  widget: Widget;
  onClose: () => void;
  onUpdated: () => void;
}

export default function WidgetConfigModal({
  open,
  widget,
  onClose,
  onUpdated,
}: Props) {
  const t = useTranslations("Dashboard");
  const isMouse = widget.type === "mouse_heatmap";
  const [mounted, setMounted] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [mousePeriod, setMousePeriod] = useState<MousePeriod>(() =>
    readMousePeriod(widget.config)
  );
  const [trackedPages, setTrackedPages] = useState<TrackedPage[]>([]);
  const [loadingTrackedPages, setLoadingTrackedPages] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    fetchTags(widget.applicationId).then(setTags);
    fetchTunnels(widget.applicationId).then(setTunnels);
  }, [open, widget.applicationId]);

  useEffect(() => {
    if (!open || !isMouse) return;

    setMousePeriod(readMousePeriod(widget.config));
  }, [open, isMouse, widget.config]);

  useEffect(() => {
    if (!open || !isMouse) return;

    let cancelled = false;
    setLoadingTrackedPages(true);

    fetchTrackedPages(widget.applicationId, mousePeriod).then((pages) => {
      if (cancelled) return;
      setTrackedPages(pages);
      setLoadingTrackedPages(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, isMouse, widget.applicationId, mousePeriod]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
    // onClose is unstable from parents; Escape should use the latest callback via ref-less closure per open session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-stretch justify-center bg-black/60 p-3 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-surface-1 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="widget-config-title"
      >
        <header className="shrink-0 border-b border-border-subtle px-6 py-4">
          <h2 id="widget-config-title" className="text-lg font-semibold">
            {t("configTitle")}
          </h2>
          <p className="mt-1 truncate text-sm text-foreground-muted">
            {widget.title}
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <WidgetConfigForm
            key={widget.id}
            widget={widget}
            tags={tags}
            tunnels={tunnels}
            trackedPages={isMouse ? trackedPages : undefined}
            loadingTrackedPages={isMouse ? loadingTrackedPages : undefined}
            onMousePeriodChange={isMouse ? setMousePeriod : undefined}
            onCancel={onClose}
            onSaved={() => {
              onUpdated();
              onClose();
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
