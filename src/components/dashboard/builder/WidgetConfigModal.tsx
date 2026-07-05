"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchTags, type Tag, type Widget } from "@/lib/dashboardApi";
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
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (!open) return;

    fetchTags(widget.applicationId).then(setTags);
  }, [open, widget.applicationId]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface-1 p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="widget-config-title"
      >
        <h2 id="widget-config-title" className="text-lg font-semibold">
          {t("configTitle")}
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">{widget.title}</p>

        <div className="mt-6">
          <WidgetConfigForm
            widget={widget}
            tags={tags}
            onCancel={onClose}
            onSaved={() => {
              onUpdated();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
