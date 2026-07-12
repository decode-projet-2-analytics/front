import type { PeriodPreset, TimeStep, WidgetConfig } from "@/lib/dashboardApi";

export type { PeriodPreset, TimeStep };

export const PERIOD_PRESETS: PeriodPreset[] = ["1h", "24h", "7d", "30d"];
export const TIME_STEPS: TimeStep[] = ["1h", "1d", "1w"];
export type BreakdownDimension = "url" | "referrer";
export const BREAKDOWN_DIMENSIONS: BreakdownDimension[] = ["url", "referrer"];

const PERIOD_MS: Record<PeriodPreset, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function inferPeriod(timeRange: WidgetConfig["timeRange"]): PeriodPreset {
  if (!timeRange.from || !timeRange.to) return "24h";

  const diff =
    new Date(timeRange.to).getTime() - new Date(timeRange.from).getTime();

  for (const preset of PERIOD_PRESETS) {
    if (Math.abs(diff - PERIOD_MS[preset]) < 60_000) {
      return preset;
    }
  }

  return "24h";
}

export function buildTimeRange(
  period: PeriodPreset,
  step: TimeStep
): WidgetConfig["timeRange"] {
  const to = new Date();
  const from = new Date(to.getTime() - PERIOD_MS[period]);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    step,
  };
}

export function readEventType(filters: Record<string, unknown>): string {
  return typeof filters.type === "string" ? filters.type : "";
}

export function readTagId(filters: Record<string, unknown>): number | null {
  if (filters.tagId == null || filters.tagId === "") return null;
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
