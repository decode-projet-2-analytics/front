"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Widget } from "@/lib/dashboardApi";
import WidgetCancelDropZone from "./WidgetCancelDropZone";
import WidgetCard from "./WidgetCard";

interface Props {
  widget: Widget;
  refreshKey: number;
  canManageWidget: boolean;
  reordering?: boolean;
  liveData?: unknown;
  onDeleted: () => void;
  onUpdated: () => void;
}

export default function SortableWidgetCard({
  widget,
  refreshKey,
  canManageWidget,
  reordering = false,
  liveData = null,
  onDeleted,
  onUpdated,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    disabled: reordering,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "relative z-10" : undefined}>
      {isDragging && canManageWidget ? (
        <WidgetCancelDropZone widgetId={widget.id} />
      ) : (
        <WidgetCard
          widget={widget}
          refreshKey={refreshKey}
          reordering={reordering}
          canManageWidget={canManageWidget}
          liveData={liveData}
          dragHandleProps={canManageWidget ? { ...attributes, ...listeners } : undefined}
          onDeleted={onDeleted}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}
