"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchWidgetData,
  type HeatmapWidgetData,
  type Widget,
  type WidgetMetric,
} from "@/lib/dashboardApi";
import { inferPeriod } from "../builder/widgetConfigUtils";
import { WidgetContentSkeleton } from "../WidgetSkeleton";

interface Props {
  widget: Widget;
  refreshKey?: number;
}

interface HoveredCell {
  row: number;
  col: number;
  value: number;
}

function isHeatmapData(data: unknown): data is HeatmapWidgetData {
  return (
    typeof data === "object" &&
    data !== null &&
    "cells" in data &&
    "layout" in data &&
    "rows" in data &&
    "cols" in data
  );
}

function formatCellValue(value: number, metric: WidgetMetric): string {
  if (metric === "rate") {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function addDays(fromIso: string, days: number): Date {
  const date = new Date(fromIso);
  date.setDate(date.getDate() + days);
  return date;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
  });
}

function dayTotal(data: HeatmapWidgetData): number {
  return data.slotCount ?? data.rows;
}

function formatDetailLabel(
  row: number,
  col: number,
  value: number,
  data: HeatmapWidgetData,
  widget: Widget,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  const formatted = formatCellValue(value, data.metric);
  const metric = t(`metric_${data.metric}`).toLowerCase();
  const from = widget.config.timeRange.from;

  switch (data.layout) {
    case "day_hour": {
      const dateLabel = from
        ? formatShortDate(addDays(from, row))
        : t("heatmapRowDayShort", { day: row + 1 });
      return t("heatmapDetailDayHour", {
        date: dateLabel,
        hour: col,
        value: formatted,
        metric,
      });
    }
    case "weekday_hour":
      return t("heatmapDetailWeekdayHour", {
        weekday: t(`day_${row + 1}`),
        hour: col,
        value: formatted,
        metric,
      });
    case "hour_of_day":
      return t("heatmapDetailHour", { hour: col, value: formatted, metric });
    case "minute_slots":
      return t("heatmapDetailMinute", {
        from: col * 5,
        to: col * 5 + 5,
        value: formatted,
        metric,
      });
    case "day_slots": {
      const dayIndex = row * data.cols + col + 1;
      const dateLabel = from
        ? formatShortDate(addDays(from, dayIndex - 1))
        : t("heatmapDayOfTotal", { day: dayIndex, total: dayTotal(data) });
      return t("heatmapDetailDay", { date: dateLabel, value: formatted, metric });
    }
    case "week_slots":
      return t("heatmapDetailWeek", { week: col + 1, value: formatted, metric });
    default:
      return formatted;
  }
}

function formatRowLabel(
  row: number,
  data: HeatmapWidgetData,
  fromIso: string | null,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  if (data.layout === "day_hour" && fromIso) {
    return formatShortDate(addDays(fromIso, row));
  }

  if (data.rowLabelType === "weekday") {
    return t(`day_${row + 1}`).slice(0, 3);
  }

  if (data.rowLabelType === "day_index") {
    return t("heatmapRowDayShort", { day: row + 1 });
  }

  return "";
}

function formatColLabel(
  col: number,
  data: HeatmapWidgetData,
  fromIso: string | null,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  switch (data.colLabelType) {
    case "hour":
      return col % 6 === 0 ? `${col}h` : "";
    case "minute":
      return `${col * 5}m`;
    case "day_index":
      if (fromIso && data.layout === "day_slots" && data.rows === 1) {
        return formatShortDate(addDays(fromIso, col));
      }
      return t("heatmapRowDayShort", { day: col + 1 });
    case "week_index":
      return t("heatmapWeekShort", { week: col + 1 });
    default:
      return "";
  }
}

function resolveHeatmapMinHeight(data: HeatmapWidgetData): number {
  if (data.layout === "day_hour" || data.layout === "weekday_hour") return 280;
  if (data.rows === 1) return 180;
  return 220;
}

function resolvePeriodTotal(data: HeatmapWidgetData): number {
  if (typeof data.total === "number") return data.total;
  if (data.metric === "rate") return data.cells[0]?.value ?? 0;
  return data.cells.reduce((sum, cell) => sum + cell.value, 0);
}

export default function HeatmapWidget({ widget, refreshKey = 0 }: Props) {
  const t = useTranslations("Dashboard");
  const [data, setData] = useState<HeatmapWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hovered, setHovered] = useState<HoveredCell | null>(null);
  const period = inferPeriod(widget.config.timeRange);
  const fromIso = widget.config.timeRange.from;

  useEffect(() => {
    let cancelled = false;
    const isInitialLoad = data === null && !error;

    if (isInitialLoad) setLoading(true);
    setError(false);

    fetchWidgetData(widget.id).then((result) => {
      if (cancelled) return;

      if (!isHeatmapData(result)) {
        setError(true);
        if (isInitialLoad) setData(null);
      } else {
        setData(result);
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [widget.id, widget.updatedAt, refreshKey]);

  const lookup = useMemo(() => {
    const map = new Map<string, number>();
    data?.cells.forEach((cell) => {
      map.set(`${cell.row}-${cell.col}`, cell.value);
    });
    return map;
  }, [data]);

  if (loading && !data) {
    return <WidgetContentSkeleton type="heatmap" />;
  }

  if (error && !data) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-error">
        {t("heatmapError")}
      </div>
    );
  }

  if (!data || data.cells.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
        {t("heatmapNoData")}
      </div>
    );
  }

  const showRowLabels = data.rowLabelType !== "none" || data.layout === "day_hour";
  const showColLabels = data.colLabelType !== "none" && data.cols > 1;
  const periodTotal = resolvePeriodTotal(data);
  const minHeight = resolveHeatmapMinHeight(data);

  const detailText =
    hovered && data
      ? formatDetailLabel(hovered.row, hovered.col, hovered.value, data, widget, t)
      : t("heatmapHoverHint");

  return (
    <div
      className={`flex w-full flex-col rounded-lg border border-border-subtle bg-surface-0 p-3 transition-opacity ${loading ? "opacity-70" : ""}`}
      style={{ minHeight }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-foreground-secondary">
          {t(`period_${period}`)}
        </span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-foreground-secondary">
          {t(`step_${data.step as "1h" | "1d" | "1w"}`)}
        </span>
        <span className="rounded-full bg-primary-muted px-2 py-0.5 text-[10px] text-primary">
          {t(`metric_${data.metric}`)}
        </span>
      </div>

      <div className="mb-4 flex items-baseline gap-2 border-b border-border-subtle pb-3">
        <span className="text-3xl font-semibold tabular-nums">
          {formatCellValue(periodTotal, data.metric)}
        </span>
        <span className="text-xs text-foreground-muted">
          {t("heatmapLayoutPeriod")}
        </span>
      </div>

      {showColLabels && (
        <div
          className="mb-1 grid gap-1 text-[9px] text-foreground-muted"
          style={{
            gridTemplateColumns: showRowLabels
              ? `4.5rem repeat(${data.cols}, minmax(0, 1fr))`
              : `repeat(${data.cols}, minmax(0, 1fr))`,
          }}
        >
          {showRowLabels && <div />}
          {Array.from({ length: data.cols }, (_, col) => (
            <div key={col} className="truncate text-center">
              {formatColLabel(col, data, fromIso, t)}
            </div>
          ))}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-1">
        {Array.from({ length: data.rows }, (_, row) => (
          <div
            key={row}
            className="grid min-h-0 flex-1 gap-1"
            style={{
              gridTemplateColumns: showRowLabels
                ? `4.5rem repeat(${data.cols}, minmax(0, 1fr))`
                : `repeat(${data.cols}, minmax(0, 1fr))`,
            }}
          >
            {showRowLabels && (
              <div className="flex items-center truncate pr-1 text-[10px] text-foreground-secondary">
                {formatRowLabel(row, data, fromIso, t)}
              </div>
            )}

            {Array.from({ length: data.cols }, (_, col) => {
              const value = lookup.get(`${row}-${col}`) ?? 0;
              const intensity = data.max > 0 ? value / data.max : 0;
              const isHovered = hovered?.row === row && hovered?.col === col;

              return (
                <button
                  key={col}
                  type="button"
                  aria-label={formatDetailLabel(row, col, value, data, widget, t)}
                  onMouseEnter={() => setHovered({ row, col, value })}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered({ row, col, value })}
                  onBlur={() => setHovered(null)}
                  className={`min-h-[14px] rounded-sm border transition-all ${
                    isHovered
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-transparent hover:border-border"
                  }`}
                  style={{
                    backgroundColor: `color-mix(in srgb, #6673ff ${Math.max(8, Math.round(intensity * 90))}%, transparent)`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[9px] text-foreground-muted">
        <span>{t("heatmapLegendLow")}</span>
        <div className="h-2 flex-1 rounded-full bg-linear-to-r from-surface-2 via-primary/50 to-primary" />
        <span>{t("heatmapLegendHigh")}</span>
      </div>

      <div className="mt-2 rounded-md bg-surface-2 px-3 py-2 text-xs text-foreground-secondary">
        {detailText}
      </div>
    </div>
  );
}
