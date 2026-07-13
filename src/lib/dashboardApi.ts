"use server";

import { apiFetch } from "./api";
import type { WidgetSeries } from "./metadataFilters";

export type WidgetType =
  | "events"
  | "funnel"
  | "mouse_heatmap"
  | "breakdown"
  | "scroll_depth";
export type WidgetMetric = "count" | "sessions" | "share" | "rate";
export type PeriodPreset = "1h" | "24h" | "7d" | "30d";
export type TimeStep = "1h" | "1d" | "1w";
export type EventVisualization =
  | "nombre"
  | "line"
  | "bar"
  | "pie"
  | "doughnut"
  | "activity";

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  filters: Record<string, unknown>;
  timeRange: {
    from: string | null;
    to: string | null;
    step: string;
    /** Sliding window preset; preferred over absolute from/to when present. */
    preset?: PeriodPreset;
  };
  metric: WidgetMetric;
  tagId?: number;
  visualization?: EventVisualization;
  series?: WidgetSeries[];
  tunnelId?: number;
  mouse?: {
    period: "today" | "7d" | "30d";
    page: string | null;
  };
  layout?: WidgetLayout;
}

export interface Widget {
  id: number;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  position: number;
  applicationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWidgetBody {
  type: WidgetType;
  title: string;
  applicationId: number;
  config?: Partial<WidgetConfig>;
  position?: number;
}

export interface UpdateWidgetBody {
  type?: WidgetType;
  title?: string;
  config?: Partial<WidgetConfig>;
  position?: number;
}

export interface Tag {
  id: number;
  slug: string;
  comment: string;
  applicationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimeseriesPoint {
  at: string;
  value: number;
}

export interface FunnelStep {
  index: number;
  tagId: number;
  slug: string;
  label: string;
  count: number;
}

export interface FunnelDropOff {
  fromIndex: number;
  toIndex: number;
  lost: number;
  rate: number;
}

export interface FunnelWidgetData {
  tunnelId: number;
  tunnelName: string;
  metric: "count";
  steps: FunnelStep[];
  conversionRate: number;
  dropOff: FunnelDropOff[];
}

export interface EventsSeriesValue {
  name: string;
  value: number;
}

export interface EventsSeriesPoint {
  name: string;
  points: TimeseriesPoint[];
}

export interface EventsKpiWidgetData {
  visualization: EventVisualization;
  series: EventsSeriesValue[];
  metric: WidgetMetric;
}

export interface EventsTimeseriesWidgetData {
  visualization: "line" | "timeseries" | "activity";
  step?: string;
  metric: WidgetMetric;
  series: EventsSeriesPoint[];
}

export type EventsWidgetData =
  | EventsKpiWidgetData
  | EventsTimeseriesWidgetData;

export interface BreakdownRow {
  key: string;
  value: number;
}

export interface BreakdownWidgetData {
  metric: WidgetMetric;
  groupBy: string;
  rows: BreakdownRow[];
  total: number;
}

export interface ScrollDepthBucket {
  range: string;
  sessions: number;
}

export interface ScrollDepthWidgetData {
  average: number;
  buckets: ScrollDepthBucket[];
  sessionsTracked: number;
}

export type WidgetData =
  | FunnelWidgetData
  | EventsWidgetData
  | BreakdownWidgetData
  | ScrollDepthWidgetData;

export async function fetchWidgets(applicationId: number): Promise<Widget[]> {
  const res = await apiFetch(
    `/widgets?applicationId=${encodeURIComponent(String(applicationId))}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  return res.json();
}

export async function createWidget(body: CreateWidgetBody): Promise<Widget | null> {
  const res = await apiFetch("/widgets", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateWidget(
  id: number,
  body: UpdateWidgetBody,
): Promise<Widget | null> {
  const res = await apiFetch(`/widgets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function deleteWidget(id: number): Promise<boolean> {
  const res = await apiFetch(`/widgets/${id}`, { method: "DELETE" });
  return res.ok;
}

export async function fetchTags(applicationId: number): Promise<Tag[]> {
  const res = await apiFetch(
    `/tags?applicationId=${encodeURIComponent(String(applicationId))}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  return res.json();
}

export async function saveWidgetOrder(widgets: Widget[]): Promise<boolean> {
  for (let i = 0; i < widgets.length; i++) {
    const tempPosition = -(i + 1);
    const movedToTemp = await updateWidget(widgets[i].id, { position: tempPosition });
    if (!movedToTemp) return false;
  }

  for (let i = 0; i < widgets.length; i++) {
    const movedToFinal = await updateWidget(widgets[i].id, { position: i });
    if (!movedToFinal) return false;
  }

  return true;
}

export async function moveWidgetInList(
  widgets: Widget[],
  widgetId: number,
  direction: "up" | "down"
): Promise<boolean> {
  const sorted = [...widgets].sort(
    (a, b) => a.position - b.position || a.id - b.id
  );
  const index = sorted.findIndex((widget) => widget.id === widgetId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
    return false;
  }

  [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];

  return saveWidgetOrder(sorted);
}

export async function fetchWidgetData(id: number): Promise<WidgetData | null> {
  try {
    const res = await apiFetch(`/widgets/${id}/data`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
