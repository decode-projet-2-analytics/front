"use server";

import { getTokenServer } from "./auth";
import { API_BASE_URL } from "./env";

export type WidgetType = "kpi" | "timeseries" | "heatmap";
export type WidgetMetric = "count" | "rate";
export type PeriodPreset = "1h" | "24h" | "7d" | "30d";
export type TimeStep = "1h" | "1d" | "1w";

export interface WidgetConfig {
  filters: Record<string, unknown>;
  timeRange: {
    from: string | null;
    to: string | null;
    step: string;
  };
  metric: WidgetMetric;
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
  comment: string;
  applicationId: number;
  tunnelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface KpiWidgetData {
  value: number;
  metric: WidgetMetric;
  count?: number;
  uniqueSessions?: number;
}

export interface TimeseriesPoint {
  at: string;
  value: number;
}

export interface TimeseriesWidgetData {
  metric: WidgetMetric;
  step: string;
  points: TimeseriesPoint[];
}

export interface HeatmapCell {
  row: number;
  col: number;
  value: number;
}

export type HeatmapLayout =
  | "single"
  | "minute_slots"
  | "hour_of_day"
  | "day_hour"
  | "weekday_hour"
  | "day_slots"
  | "week_slots";

export interface HeatmapWidgetData {
  metric: WidgetMetric;
  step: string;
  layout: HeatmapLayout;
  rows: number;
  cols: number;
  labelKey: string;
  rowLabelType: "weekday" | "day_index" | "none";
  colLabelType: "hour" | "minute" | "day_index" | "week_index" | "none";
  slotCount: number | null;
  cells: HeatmapCell[];
  max: number;
  total: number;
}

export type WidgetData =
  | KpiWidgetData
  | TimeseriesWidgetData
  | HeatmapWidgetData;

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getTokenServer();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function jsonHeaders(): Promise<HeadersInit> {
  return {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
  };
}

export async function fetchWidgets(applicationId: number): Promise<Widget[]> {
  const url = new URL(`${API_BASE_URL}/widgets`);
  url.searchParams.set("applicationId", String(applicationId));

  const res = await fetch(url.toString(), {
    headers: await getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

export async function createWidget(body: CreateWidgetBody): Promise<Widget | null> {
  const res = await fetch(`${API_BASE_URL}/widgets`, {
    method: "POST",
    headers: await jsonHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  return res.json();
}

export async function updateWidget(
  id: number,
  body: UpdateWidgetBody
): Promise<Widget | null> {
  const res = await fetch(`${API_BASE_URL}/widgets/${id}`, {
    method: "PATCH",
    headers: await jsonHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  return res.json();
}

export async function deleteWidget(id: number): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/widgets/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });

  return res.ok;
}

export async function fetchTags(applicationId: number): Promise<Tag[]> {
  const url = new URL(`${API_BASE_URL}/tags`);
  url.searchParams.set("applicationId", String(applicationId));

  const res = await fetch(url.toString(), {
    headers: await getAuthHeaders(),
    cache: "no-store",
  });

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
  const res = await fetch(`${API_BASE_URL}/widgets/${id}/data`, {
    headers: await getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}
