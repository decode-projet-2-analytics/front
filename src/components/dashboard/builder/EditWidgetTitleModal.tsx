"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { updateWidget, type Widget } from "@/lib/dashboardApi";

interface Props {
  open: boolean;
  widget: Widget;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditWidgetTitleModal({
  open,
  widget,
  onClose,
  onUpdated,
}: Props) {
  const t = useTranslations("Dashboard");
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState(widget.title);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setTitle(widget.title);
      setError(null);
    }
  }, [open, widget.title]);

  if (!open || !mounted) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    if (trimmedTitle === widget.title) {
      onClose();
      return;
    }

    startTransition(async () => {
      const updated = await updateWidget(widget.id, { title: trimmedTitle });
      if (!updated) {
        setError(t("updateError"));
        return;
      }
      onUpdated();
      onClose();
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface-1 p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-widget-title"
      >
        <h2 id="edit-widget-title" className="text-lg font-semibold">
          {t("editWidget")}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground-muted">
              {t("widgetTitle")}
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm outline-none focus:border-white focus:outline-none focus:ring-0"
              required
              autoFocus
            />
          </label>

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? t("saving") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
