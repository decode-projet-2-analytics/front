import type {
  EventVisualization,
  PeriodPreset,
  TimeStep,
  WidgetConfig,
  WidgetMetric,
} from "@/lib/dashboardApi";
import type { MetadataFilter, WidgetSeries } from "@/lib/metadataFilters";

export type { PeriodPreset, TimeStep };

export const PERIOD_PRESETS: PeriodPreset[] = ["1h", "24h", "7d", "30d"];
export const TIME_STEPS: TimeStep[] = ["1h", "1d", "1w"];
export const EVENT_VISUALIZATIONS: EventVisualization[] = [
  "nombre",
  "line",
  "bar",
  "pie",
  "doughnut",
  "activity",
];
export const EVENT_METRICS: WidgetMetric[] = ["count", "sessions"];

export type BreakdownDimension = "url" | "referrer";
export const BREAKDOWN_DIMENSIONS: BreakdownDimension[] = ["url", "referrer"];

const LEGACY_VISUALIZATION_MAP: Record<string, EventVisualization> = {
  kpi: "nombre",
  comparison: "bar",
  timeseries: "line",
  radar: "bar",
  polarArea: "pie",
  heatmap: "activity",
};

export function normalizeEventVisualization(
  visualization?: string | null
): EventVisualization {
  if (!visualization) return "nombre";
  if ((EVENT_VISUALIZATIONS as string[]).includes(visualization)) {
    return visualization as EventVisualization;
  }
  return LEGACY_VISUALIZATION_MAP[visualization] ?? "nombre";
}

/** Legacy `rate` / `share` map to event counts. */
export function normalizeWidgetMetric(
  metric?: string | null
): "count" | "sessions" {
  if (metric === "sessions") return "sessions";
  return "count";
}

export function readBreakdownMetric(
  metric?: string | null
): "count" | "rate" {
  return metric === "rate" ? "rate" : "count";
}

const PERIOD_MS: Record<PeriodPreset, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function inferPeriod(
  timeRange?: WidgetConfig["timeRange"] | null
): PeriodPreset {
  if (
    timeRange?.preset &&
    (PERIOD_PRESETS as string[]).includes(timeRange.preset)
  ) {
    return timeRange.preset;
  }

  if (timeRange?.from && timeRange?.to) {
    const diff =
      new Date(timeRange.to).getTime() - new Date(timeRange.from).getTime();

    for (const preset of PERIOD_PRESETS) {
      if (Math.abs(diff - PERIOD_MS[preset]) < 60_000) {
        return preset;
      }
    }
  }

  if (timeRange?.from && !timeRange?.to) {
    const diff = Date.now() - new Date(timeRange.from).getTime();
    for (const preset of PERIOD_PRESETS) {
      if (Math.abs(diff - PERIOD_MS[preset]) < 60_000) {
        return preset;
      }
    }
  }

  return "24h";
}

export function buildTimeRange(
  period: PeriodPreset,
  step: TimeStep
): WidgetConfig["timeRange"] {
  // Rolling window: backend resolves from/to at query time via `preset`.
  // Keep `to: null` so new events are never cut off by a frozen end date.
  return {
    from: null,
    to: null,
    step,
    preset: period,
  };
}

export function readEventType(
  filters?: Record<string, unknown> | null
): string {
  return typeof filters?.type === "string" ? filters.type : "";
}

export function readTagId(
  filters?: Record<string, unknown> | null
): number | null {
  if (filters?.tagId == null || filters.tagId === "") return null;
  const id = Number(filters.tagId);
  return Number.isNaN(id) ? null : id;
}

export function readGroupBy(
  filters: Record<string, unknown>
): BreakdownDimension {
  return filters.groupBy === "referrer" ? "referrer" : "url";
}

export function buildWidgetConfig(
  current: WidgetConfig,
  period: PeriodPreset,
  step: TimeStep,
  metric: WidgetConfig["metric"],
  eventType: string,
  tagId: number | null,
  groupBy?: BreakdownDimension | null
): WidgetConfig {
  const filters: Record<string, unknown> = {};

  if (eventType.trim()) {
    filters.type = eventType.trim();
  }

  if (tagId != null) {
    filters.tagId = tagId;
  }

  if (groupBy) {
    filters.groupBy = groupBy;
  }

  return {
    ...current,
    metric,
    timeRange: buildTimeRange(period, step),
    filters,
  };
}

export function readEventsTagId(
  config?: Partial<WidgetConfig> | null
): number | "" {
  if (config?.tagId != null) return Number(config.tagId);
  return readTagId(config?.filters) ?? "";
}

export function readEventVisualization(
  config?: Partial<WidgetConfig> | null
): EventVisualization {
  return normalizeEventVisualization(config?.visualization);
}

export function readEventSeries(
  config?: Partial<WidgetConfig> | null
): WidgetSeries[] {
  if (Array.isArray(config?.series) && config.series.length > 0) {
    return config.series.map((series, index) => ({
      name: series.name || `Series ${index + 1}`,
      filters: Array.isArray(series.filters) ? series.filters : [],
    }));
  }

  return [{ name: "All", filters: [] }];
}

function sanitizeFilters(filters: MetadataFilter[]): MetadataFilter[] {
  return filters
    .map((filter) => ({
      ...filter,
      key: filter.key.trim(),
      value: filter.op === "exists" ? undefined : filter.value,
    }))
    .filter((filter) => filter.key.length > 0);
}

function sanitizeSeries(series: WidgetSeries[]): WidgetSeries[] {
  const normalized = series.map((item, index) => ({
    name: item.name.trim() || `Series ${index + 1}`,
    filters: sanitizeFilters(item.filters),
  }));

  return normalized.length > 0 ? normalized : [{ name: "All", filters: [] }];
}

export function buildEventsConfig(
  current: WidgetConfig,
  period: PeriodPreset,
  step: TimeStep,
  metric: WidgetConfig["metric"],
  tagId: number,
  visualization: EventVisualization,
  series: WidgetSeries[]
): WidgetConfig {
  const resolvedStep: TimeStep =
    visualization === "nombre" ? "1d" : step;

  return {
    ...current,
    tagId,
    visualization,
    metric,
    timeRange: buildTimeRange(period, resolvedStep),
    series: sanitizeSeries(series),
    filters: {},
  };
}

export function buildFunnelConfig(
  current: WidgetConfig,
  period: PeriodPreset,
  tunnelId: number
): WidgetConfig {
  return {
    ...current,
    metric: "count",
    tunnelId,
    timeRange: buildTimeRange(
      period,
      (current.timeRange?.step as TimeStep) || "1h"
    ),
    filters: {},
  };
}

export function readTunnelId(
  config?: Partial<WidgetConfig> | null
): number | "" {
  return config?.tunnelId != null ? Number(config.tunnelId) : "";
}

export type MousePeriod = "today" | "7d" | "30d";

export const MOUSE_PERIODS: MousePeriod[] = ["today", "7d", "30d"];

export function buildMouseConfig(
  current: WidgetConfig,
  period: MousePeriod,
  page: string | null
): WidgetConfig {
  return {
    ...current,
    mouse: { period, page },
  };
}

export function readMousePeriod(
  config?: Partial<WidgetConfig> | null
): MousePeriod {
  const p = config?.mouse?.period;
  return p === "today" || p === "7d" || p === "30d" ? p : "7d";
}

export function readMousePage(
  config?: Partial<WidgetConfig> | null
): string | null {
  return config?.mouse?.page ?? null;
}
