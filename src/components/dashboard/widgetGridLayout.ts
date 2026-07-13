import type { Widget } from "@/lib/dashboardApi";

export const WIDGETS_PER_ROW = 3;

export function isFullWidthWidget(widget: Widget): boolean {
  return widget.type === "mouse_heatmap" || widget.type === "funnel";
}

export function sortWidgets(widgets: Widget[]): Widget[] {
  return [...widgets].sort(
    (a, b) => a.position - b.position || a.id - b.id
  );
}

export const SECTION_ORDER = ["events", "funnel", "heatmap"] as const;
export type SectionKey = (typeof SECTION_ORDER)[number];

export function sectionKeyForWidget(widget: Widget): SectionKey {
  if (widget.type === "mouse_heatmap") return "heatmap";
  if (widget.type === "funnel") return "funnel";
  return "events";
}

export function groupWidgetsBySection(
  widgets: Widget[]
): { key: SectionKey; widgets: Widget[] }[] {
  const sorted = sortWidgets(widgets);
  return SECTION_ORDER.map((key) => ({
    key,
    widgets: sorted.filter((w) => sectionKeyForWidget(w) === key),
  })).filter((section) => section.widgets.length > 0);
}

export function packWidgetRowsBySection(widgets: Widget[]): Widget[][] {
  return groupWidgetsBySection(widgets).flatMap((section) =>
    packWidgetRows(section.widgets)
  );
}

export function applyWidgetPositions(widgets: Widget[]): Widget[] {
  return widgets.map((widget, index) => ({
    ...widget,
    position: index,
  }));
}

export function packWidgetRows(widgets: Widget[]): Widget[][] {
  const rows: Widget[][] = [];
  let currentRow: Widget[] = [];

  for (const widget of widgets) {
    if (isFullWidthWidget(widget)) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
      }
      rows.push([widget]);
      continue;
    }

    currentRow.push(widget);
    if (currentRow.length >= WIDGETS_PER_ROW) {
      rows.push(currentRow);
      currentRow = [];
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

export function flattenRows(rows: Widget[][]): Widget[] {
  return rows.flat();
}

export function findRowIndexForWidget(rows: Widget[][], widgetId: number): number {
  return rows.findIndex((row) => row.some((widget) => widget.id === widgetId));
}

export function getFlatIndexForRowGap(rows: Widget[][], gapIndex: number): number {
  let index = 0;

  for (let i = 0; i < gapIndex && i < rows.length; i++) {
    index += rows[i].length;
  }

  return index;
}

export function rowGapId(gapIndex: number): string {
  return `row-gap-${gapIndex}`;
}

export function widgetCancelId(widgetId: number): string {
  return `widget-cancel-${widgetId}`;
}

export function isRowGapId(id: string | number): boolean {
  return String(id).startsWith("row-gap-");
}

export function isWidgetCancelId(id: string | number): boolean {
  return String(id).startsWith("widget-cancel-");
}

export function parseRowGapIndex(id: string | number): number {
  return Number(String(id).replace("row-gap-", ""));
}

export function isRowGapEnabled(
  gapIndex: number,
  activeRowIndex: number,
  activeWidget: Widget | null,
  isDragging: boolean
): boolean {
  if (!isDragging) return false;
  if (activeRowIndex < 0) return true;
  if (gapIndex === activeRowIndex) return false;

  if (
    activeWidget &&
    isFullWidthWidget(activeWidget) &&
    gapIndex === activeRowIndex + 1
  ) {
    return false;
  }

  return true;
}

export function insertWidgetAtRowGap(
  widgets: Widget[],
  widgetId: number,
  gapIndex: number
): Widget[] {
  const widget = widgets.find((item) => item.id === widgetId);
  if (!widget) return widgets;

  const withoutWidget = widgets.filter((item) => item.id !== widgetId);
  const rows = packWidgetRowsBySection(withoutWidget);
  const insertAt = getFlatIndexForRowGap(rows, gapIndex);

  const next = [...withoutWidget];
  next.splice(insertAt, 0, widget);
  return next;
}

function swapAdjacent(widgets: Widget[], index: number, targetIndex: number): Widget[] {
  const next = [...widgets];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

export function reorderWidgets(
  widgets: Widget[],
  widgetId: number,
  direction: "up" | "down"
): Widget[] | null {
  const sorted = sortWidgets(widgets);
  const index = sorted.findIndex((widget) => widget.id === widgetId);

  if (index < 0) return null;

  const widget = sorted[index];
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (!isFullWidthWidget(widget)) {
    if (targetIndex < 0 || targetIndex >= sorted.length) return null;
    return swapAdjacent(sorted, index, targetIndex);
  }

  const rows = packWidgetRowsBySection(sorted);
  const rowIndex = rows.findIndex((row) =>
    row.some((item) => item.id === widgetId)
  );

  if (rowIndex < 0) return null;

  if (direction === "down") {
    if (rowIndex >= rows.length - 1) return null;

    const nextRow = rows[rowIndex + 1];
    if (nextRow.some(isFullWidthWidget)) {
      if (targetIndex >= sorted.length) return null;
      return swapAdjacent(sorted, index, targetIndex);
    }

    const withoutFullWidth = sorted.filter((item) => item.id !== widgetId);
    const anchorId = nextRow[nextRow.length - 1].id;
    const insertIndex = withoutFullWidth.findIndex((item) => item.id === anchorId) + 1;
    withoutFullWidth.splice(insertIndex, 0, widget);
    return withoutFullWidth;
  }

  if (rowIndex <= 0) return null;

  const previousRow = rows[rowIndex - 1];
  if (previousRow.some(isFullWidthWidget)) {
    if (targetIndex < 0) return null;
    return swapAdjacent(sorted, index, targetIndex);
  }

  const withoutFullWidth = sorted.filter((item) => item.id !== widgetId);
  const anchorId = previousRow[0].id;
  const insertIndex = withoutFullWidth.findIndex((item) => item.id === anchorId);
  withoutFullWidth.splice(insertIndex, 0, widget);
  return withoutFullWidth;
}
