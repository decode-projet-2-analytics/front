"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Widget } from "@/lib/dashboardApi";
import WidgetCancelDropZone from "./WidgetCancelDropZone";
import WidgetCard from "./WidgetCard";

interface Props {
  widget: Widget;
  refreshKey: number;
  reordering?: boolean;
  liveData?: unknown;
  onDeleted: () => void;
  onUpdated: () => void;
}

export default function SortableWidgetCard({
  widget,
  refreshKey,
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
      {isDragging ? (
        <WidgetCancelDropZone widgetId={widget.id} />
      ) : (
        <WidgetCard
          widget={widget}
          refreshKey={refreshKey}
          reordering={reordering}
          liveData={liveData}
          dragHandleProps={{ ...attributes, ...listeners }}
          onDeleted={onDeleted}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}
