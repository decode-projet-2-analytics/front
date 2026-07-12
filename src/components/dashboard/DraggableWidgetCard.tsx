"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Widget } from "@/lib/dashboardApi";
import WidgetCancelDropZone from "./WidgetCancelDropZone";
import WidgetCard from "./WidgetCard";
import { isFullWidthWidget } from "./widgetGridLayout";

interface Props {
  widget: Widget;
  refreshKey: number;
  canManageWidget: boolean;
  reordering?: boolean;
  onDeleted: () => void;
  onUpdated: () => void;
}

export default function DraggableWidgetCard({
  widget,
  refreshKey,
  canManageWidget,
  reordering = false,
  onDeleted,
  onUpdated,
}: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: widget.id,
    disabled: reordering,
  });

  return (
    <div ref={setNodeRef}>
      {isDragging && canManageWidget ? (
        <WidgetCancelDropZone
          widgetId={widget.id}
          fullWidth={isFullWidthWidget(widget)}
        />
      ) : (
        <WidgetCard
          widget={widget}
          refreshKey={refreshKey}
          reordering={reordering}
          canManageWidget={canManageWidget}
          dragHandleProps={canManageWidget ? { ...attributes, ...listeners } : undefined}
          onDeleted={onDeleted}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}
