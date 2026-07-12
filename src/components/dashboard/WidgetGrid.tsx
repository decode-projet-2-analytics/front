"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import {
  fetchWidgets,
  saveWidgetOrder,
  type Widget,
} from "@/lib/dashboardApi";
import DraggableWidgetCard from "./DraggableWidgetCard";
import RowDropZone from "./RowDropZone";
import SortableWidgetCard from "./SortableWidgetCard";
import WidgetDragPreview from "./WidgetDragPreview";
import { WidgetCardSkeleton } from "./WidgetSkeleton";
import {
  applyWidgetPositions,
  findRowIndexForWidget,
  insertWidgetAtRowGap,
  isFullWidthWidget,
  isRowGapEnabled,
  isRowGapId,
  isWidgetCancelId,
  packWidgetRows,
  parseRowGapIndex,
  rowGapId,
  sortWidgets,
  widgetCancelId,
} from "./widgetGridLayout";

interface Props {
  applicationId: number | null;
  canManageWidgets: boolean;
  refreshToken?: number;
  pollTick?: number;
  onRefresh?: () => void;
}

function isSameOrder(a: Widget[], b: Widget[]): boolean {
  return a.length === b.length && a.every((widget, index) => widget.id === b[index]?.id);
}

export default function WidgetGrid({
  applicationId,
  canManageWidgets,
  refreshToken = 0,
  pollTick = 0,
  onRefresh,
}: Props) {
  const t = useTranslations("Dashboard");
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeWidget, setActiveWidget] = useState<Widget | null>(null);
  const [activeDragWidth, setActiveDragWidth] = useState<number | null>(null);
  const [, startMoveTransition] = useTransition();
  const hasLoadedRef = useRef(false);
  const saveGenerationRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    if (!applicationId) {
      hasLoadedRef.current = false;
      setWidgets([]);
      return;
    }

    let cancelled = false;

    if (!hasLoadedRef.current) {
      setLoading(true);
      setError(false);
    }

    fetchWidgets(applicationId)
      .then((data) => {
        if (!cancelled) {
          setWidgets(data);
          hasLoadedRef.current = true;
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applicationId, refreshToken]);

  const sortedWidgets = sortWidgets(widgets);
  const widgetRows = packWidgetRows(sortedWidgets);
  const isDragging = activeWidget !== null;
  const activeRowIndex =
    activeWidget !== null
      ? findRowIndexForWidget(widgetRows, activeWidget.id)
      : -1;

  function isGapEnabled(gapIndex: number): boolean {
    return isRowGapEnabled(gapIndex, activeRowIndex, activeWidget, isDragging);
  }

  const collisionDetection = useCallback<CollisionDetection>(
    (args) => {
      const activeId = Number(args.active.id);
      const active = sortedWidgets.find((widget) => widget.id === activeId);
      const rows = packWidgetRows(sortedWidgets);
      const dragRowIndex = findRowIndexForWidget(rows, activeId);

      const cancelContainers = args.droppableContainers.filter(
        (container) => String(container.id) === widgetCancelId(activeId)
      );

      const gapContainers = args.droppableContainers.filter((container) => {
        if (!isRowGapId(container.id)) return false;
        const gapIndex = parseRowGapIndex(container.id);
        return isRowGapEnabled(gapIndex, dragRowIndex, active ?? null, true);
      });

      const gapHits = pointerWithin({
        ...args,
        droppableContainers: gapContainers,
      });

      if (gapHits.length > 0) {
        return gapHits;
      }

      const cancelHits = pointerWithin({
        ...args,
        droppableContainers: cancelContainers,
      });

      if (cancelHits.length > 0) {
        return cancelHits;
      }

      if (active && isFullWidthWidget(active)) {
        return closestCenter({
          ...args,
          droppableContainers: [...cancelContainers, ...gapContainers],
        });
      }

      const sameRowIds = new Set(rows[dragRowIndex]?.map((widget) => widget.id) ?? []);
      const sameRowContainers = args.droppableContainers.filter((container) =>
        sameRowIds.has(Number(container.id))
      );

      return closestCenter({
        ...args,
        droppableContainers: sameRowContainers,
      });
    },
    [sortedWidgets]
  );

  const persistOrder = useCallback(
    (nextOrder: Widget[]) => {
      const ordered = applyWidgetPositions(nextOrder);
      setWidgets(ordered);

      const generation = saveGenerationRef.current + 1;
      saveGenerationRef.current = generation;

      startMoveTransition(async () => {
        const ok = await saveWidgetOrder(ordered);

        if (saveGenerationRef.current !== generation) return;

        if (!ok) {
          window.alert(t("reorderError"));

          if (!applicationId) return;

          const restored = await fetchWidgets(applicationId);
          setWidgets(restored);
        }
      });
    },
    [applicationId, t]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const widget = sortedWidgets.find((item) => item.id === event.active.id);
      setActiveWidget(widget ?? null);
      setActiveDragWidth(event.active.rect.current.initial?.width ?? null);
    },
    [sortedWidgets]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveWidget(null);
      setActiveDragWidth(null);

      const { active, over } = event;
      if (!over) return;

      if (isWidgetCancelId(over.id)) {
        return;
      }

      if (active.id === over.id) return;

      const activeId = Number(active.id);

      if (isRowGapId(over.id)) {
        const gapIndex = parseRowGapIndex(over.id);
        const nextOrder = insertWidgetAtRowGap(sortedWidgets, activeId, gapIndex);

        if (isSameOrder(nextOrder, sortedWidgets)) return;
        persistOrder(nextOrder);
        return;
      }

      const overId = Number(over.id);
      const rows = packWidgetRows(sortedWidgets);
      const activeRowIndex = findRowIndexForWidget(rows, activeId);
      const overRowIndex = findRowIndexForWidget(rows, overId);

      if (activeRowIndex < 0 || activeRowIndex !== overRowIndex) return;

      const row = rows[activeRowIndex];
      const oldIndex = row.findIndex((widget) => widget.id === activeId);
      const newIndex = row.findIndex((widget) => widget.id === overId);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

      const nextRows = rows.map((currentRow, index) =>
        index === activeRowIndex ? arrayMove(currentRow, oldIndex, newIndex) : currentRow
      );
      const nextOrder = nextRows.flat();

      if (isSameOrder(nextOrder, sortedWidgets)) return;
      persistOrder(nextOrder);
    },
    [persistOrder, sortedWidgets]
  );

  const handleDragCancel = useCallback(() => {
    setActiveWidget(null);
    setActiveDragWidth(null);
  }, []);

  if (!applicationId) return null;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <WidgetCardSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-error">{t("loadError")}</p>;
  }

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-1 px-6 py-16 text-center">
        <p className="text-lg font-medium">{t("noWidgets")}</p>
        <p className="mt-2 max-w-sm text-sm text-foreground-muted">
          {t("noWidgetsHint")}
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={canManageWidgets ? handleDragStart : undefined}
      onDragEnd={canManageWidgets ? handleDragEnd : undefined}
      onDragCancel={canManageWidgets ? handleDragCancel : undefined}
    >
      <div className="flex flex-col gap-4">
        <RowDropZone id={rowGapId(0)} enabled={isGapEnabled(0)} />

        {widgetRows.map((row, rowIndex) => {
          const gapIndex = rowIndex + 1;
          const isHeatmapRow = row.length === 1 && isFullWidthWidget(row[0]);

          return (
            <Fragment key={row.map((widget) => widget.id).join("-")}>
              {isHeatmapRow ? (
                <div className="grid grid-cols-1">
                  <DraggableWidgetCard
                    widget={row[0]}
                    refreshKey={pollTick}
                    canManageWidget={canManageWidgets}
                    onDeleted={() => onRefresh?.()}
                    onUpdated={() => onRefresh?.()}
                  />
                </div>
              ) : (
                <SortableContext
                  items={row.map((widget) => widget.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {row.map((widget) => (
                      <SortableWidgetCard
                        key={widget.id}
                        widget={widget}
                        refreshKey={pollTick}
                        canManageWidget={canManageWidgets}
                        onDeleted={() => onRefresh?.()}
                        onUpdated={() => onRefresh?.()}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}

              <RowDropZone id={rowGapId(gapIndex)} enabled={isGapEnabled(gapIndex)} />
            </Fragment>
          );
        })}
      </div>

      <DragOverlay adjustScale={false} dropAnimation={null}>
        {activeWidget ? (
          <div
            className="pointer-events-none max-w-full"
            style={{ width: activeDragWidth ?? 280 }}
          >
            <WidgetDragPreview widget={activeWidget} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
