"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactGridLayout, {
  WidthProvider,
  type Layout,
  type LayoutItem,
} from "react-grid-layout/legacy";
import {
  updateWidget,
  type Widget,
  type WidgetConfig,
  type WidgetType,
} from "@/lib/dashboardApi";
import WidgetCard from "../WidgetCard";

const GridLayout = WidthProvider(ReactGridLayout);

const GRID_COLS = 12;
const ROW_HEIGHT = 80;
const MARGIN_Y = 16;
const MIN_WIDTH = 3;
const MIN_HEIGHT = 4;
const DEFAULT_WIDTH = 4;
const DEFAULT_HEIGHT = 4;
const PERSIST_DEBOUNCE_MS = 500;
const FULL_WIDTH_FALLBACK_TYPES = new Set<WidgetType>([
  "mouse_heatmap",
  "funnel",
]);

const DEFAULT_HEIGHT_BY_TYPE: Partial<Record<WidgetType, number>> = {
  events: 4,
  funnel: 5,
  mouse_heatmap: 6,
};

type WidgetLayout = NonNullable<WidgetConfig["layout"]>;
type GridLayoutItem = LayoutItem;
type GridLayoutItems = Layout;

interface Props {
  widgets: Widget[];
  refreshKey: number;
  canManageWidget?: boolean;
  dataByWidgetId?: Record<number, unknown>;
  onRefresh?: () => void;
}

function isFullWidthFallback(type: WidgetType): boolean {
  return FULL_WIDTH_FALLBACK_TYPES.has(type);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toPositiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : fallback;
}

function normalizeWidgetLayout(widget: Widget, index: number): WidgetLayout {
  const configLayout = widget.config.layout;
  const fallbackWidth = isFullWidthFallback(widget.type) ? GRID_COLS : DEFAULT_WIDTH;
  const fallbackHeight = DEFAULT_HEIGHT_BY_TYPE[widget.type] ?? DEFAULT_HEIGHT;
  const width = clamp(
    toPositiveInteger(configLayout?.w, fallbackWidth),
    MIN_WIDTH,
    GRID_COLS
  );
  const height = Math.max(
    MIN_HEIGHT,
    toPositiveInteger(configLayout?.h, fallbackHeight)
  );
  const x = clamp(toPositiveInteger(configLayout?.x, 0), 0, GRID_COLS - width);
  const y = toPositiveInteger(configLayout?.y, index * fallbackHeight);

  return { x, y, w: width, h: height };
}

function toGridLayoutItem(widget: Widget, index: number): GridLayoutItem {
  return {
    i: String(widget.id),
    ...normalizeWidgetLayout(widget, index),
    minW: MIN_WIDTH,
    minH: MIN_HEIGHT,
    maxW: GRID_COLS,
  };
}

function toWidgetLayout(item: GridLayoutItem): WidgetLayout {
  return {
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  };
}

function layoutKey(layout: WidgetLayout): string {
  return `${layout.x}:${layout.y}:${layout.w}:${layout.h}`;
}

function isSameLayout(a: WidgetLayout | undefined, b: WidgetLayout): boolean {
  return a !== undefined && layoutKey(a) === layoutKey(b);
}

function gridLayoutsEqual(a: GridLayoutItems, b: GridLayoutItems): boolean {
  if (a.length !== b.length) return false;

  const byId = new Map(b.map((item) => [item.i, item]));
  return a.every((item) => {
    const other = byId.get(item.i);
    return (
      other != null &&
      Math.round(item.x) === Math.round(other.x) &&
      Math.round(item.y) === Math.round(other.y) &&
      Math.round(item.w) === Math.round(other.w) &&
      Math.round(item.h) === Math.round(other.h)
    );
  });
}

function withGridConstraints(items: GridLayoutItems): GridLayoutItem[] {
  return items.map((item) => ({
    ...item,
    x: Math.round(item.x),
    y: Math.round(item.y),
    w: Math.round(item.w),
    h: Math.round(item.h),
    minW: MIN_WIDTH,
    minH: MIN_HEIGHT,
    maxW: GRID_COLS,
  }));
}

export default function DashboardGrid({
  widgets,
  refreshKey,
  canManageWidget = true,
  dataByWidgetId,
  onRefresh,
}: Props) {
  const widgetsByIdRef = useRef(new Map<number, Widget>());
  const lastSavedLayoutsRef = useRef(new Map<number, WidgetLayout>());
  const pendingLayoutsRef = useRef(new Map<number, WidgetLayout>());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const suppressLayoutChangeRef = useRef(false);
  const [layout, setLayout] = useState<GridLayoutItem[]>(() =>
    widgets.map((widget, index) => toGridLayoutItem(widget, index))
  );

  const widgetsIdentity = useMemo(
    () =>
      widgets
        .map((widget, index) => {
          const l = normalizeWidgetLayout(widget, index);
          return `${widget.id}:${layoutKey(l)}`;
        })
        .join("|"),
    [widgets]
  );

  useEffect(() => {
    widgetsByIdRef.current = new Map(widgets.map((widget) => [widget.id, widget]));
    lastSavedLayoutsRef.current = new Map(
      widgets.map((widget, index) => [
        widget.id,
        normalizeWidgetLayout(widget, index),
      ])
    );

    const nextLayout = widgets.map((widget, index) =>
      toGridLayoutItem(widget, index)
    );

    // Avoid feedback with react-grid-layout's onLayoutChange when syncing from props.
    suppressLayoutChangeRef.current = true;
    setLayout((prev) => (gridLayoutsEqual(prev, nextLayout) ? prev : nextLayout));
    queueMicrotask(() => {
      suppressLayoutChangeRef.current = false;
    });
  }, [widgets, widgetsIdentity]);

  const flushPendingLayouts = useCallback(async function flushPendingLayouts() {
    if (savingRef.current || pendingLayoutsRef.current.size === 0) return;

    const pending = Array.from(pendingLayoutsRef.current.entries());
    pendingLayoutsRef.current.clear();
    savingRef.current = true;

    try {
      await Promise.all(
        pending.map(async ([widgetId, nextLayout]) => {
          const widget = widgetsByIdRef.current.get(widgetId);
          const lastSavedLayout = lastSavedLayoutsRef.current.get(widgetId);

          if (!widget || isSameLayout(lastSavedLayout, nextLayout)) return;

          const updated = await updateWidget(widgetId, {
            config: {
              ...widget.config,
              layout: nextLayout,
            },
          });

          if (!updated) return;

          lastSavedLayoutsRef.current.set(widgetId, nextLayout);
          widgetsByIdRef.current.set(widgetId, {
            ...updated,
            config: {
              ...updated.config,
              layout: nextLayout,
            },
          });
        })
      );
    } finally {
      savingRef.current = false;
    }

    if (pendingLayoutsRef.current.size > 0) {
      debounceRef.current = setTimeout(
        () => void flushPendingLayouts(),
        PERSIST_DEBOUNCE_MS
      );
    }
    // Do not call onRefresh() here — refetching widgets resets layout props and
    // can retrigger react-grid-layout's onLayoutChange in a loop.
  }, []);

  const queueLayoutPersist = useCallback(
    (nextLayout: GridLayoutItems) => {
      for (const item of nextLayout) {
        const widgetId = Number(item.i);
        if (!Number.isFinite(widgetId)) continue;

        const widgetLayout = toWidgetLayout(item);
        if (isSameLayout(lastSavedLayoutsRef.current.get(widgetId), widgetLayout)) {
          pendingLayoutsRef.current.delete(widgetId);
          continue;
        }

        pendingLayoutsRef.current.set(widgetId, widgetLayout);
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => void flushPendingLayouts(),
        PERSIST_DEBOUNCE_MS
      );
    },
    [flushPendingLayouts]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleLayoutChange = useCallback((nextLayout: GridLayoutItems) => {
    if (suppressLayoutChangeRef.current) return;

    const constrained = withGridConstraints(nextLayout);
    setLayout((prev) =>
      gridLayoutsEqual(prev, constrained) ? prev : constrained
    );
  }, []);

  const handleLayoutStop = useCallback(
    (nextLayout: GridLayoutItems) => {
      const constrained = withGridConstraints(nextLayout);
      setLayout((prev) =>
        gridLayoutsEqual(prev, constrained) ? prev : constrained
      );
      queueLayoutPersist(constrained);
    },
    [queueLayoutPersist]
  );

  return (
    <GridLayout
      className="dashboard-grid"
      layout={layout}
      cols={GRID_COLS}
      rowHeight={ROW_HEIGHT}
      margin={[MARGIN_Y, MARGIN_Y]}
      containerPadding={[0, 0]}
      draggableHandle=".widget-drag-handle"
      draggableCancel="button, a, input, textarea, select, [role='menu']"
      compactType="vertical"
      isResizable
      isDraggable
      onLayoutChange={handleLayoutChange}
      onDragStop={handleLayoutStop}
      onResizeStop={handleLayoutStop}
      resizeHandles={["se"]}
    >
      {widgets.map((widget) => (
        <div
          key={String(widget.id)}
          data-grid-item-id={String(widget.id)}
          className="widget-grid-item min-h-0"
        >
          <WidgetCard
            widget={widget}
            refreshKey={refreshKey}
            canManageWidget={canManageWidget}
            liveData={dataByWidgetId?.[widget.id] ?? null}
            onDeleted={() => onRefresh?.()}
            onUpdated={() => onRefresh?.()}
          />
        </div>
      ))}
    </GridLayout>
  );
}
