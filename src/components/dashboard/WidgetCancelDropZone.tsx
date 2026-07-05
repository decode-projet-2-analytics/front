"use client";

import { useDroppable } from "@dnd-kit/core";
import { useTranslations } from "next-intl";

interface Props {
  widgetId: number;
  fullWidth?: boolean;
}

export default function WidgetCancelDropZone({ widgetId, fullWidth = false }: Props) {
  const t = useTranslations("Dashboard");
  const { setNodeRef, isOver } = useDroppable({
    id: `widget-cancel-${widgetId}`,
  });

  return (
    <div
      ref={setNodeRef}
      aria-label={t("dragCancelHint")}
      title={t("dragCancelHint")}
      className={`rounded-lg transition-colors ${
        fullWidth ? "min-h-32" : "min-h-28"
      } ${
        isOver
          ? "border-2 border-primary bg-primary/15"
          : "border border-dashed border-border-subtle bg-surface-0/40"
      }`}
    />
  );
}
