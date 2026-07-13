"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type {
  EventsTimeseriesWidgetData,
  PeriodPreset,
  TimeStep,
  WidgetMetric,
} from "@/lib/dashboardApi";

interface Props {
  data: EventsTimeseriesWidgetData;
  period: PeriodPreset;
  loading?: boolean;
}

interface ActivityCell {
  at: string;
  value: number;
  col: number;
  row: number;
}

const LEVEL_CLASSES = [
  "bg-surface-2",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/65",
  "bg-primary",
] as const;

const PERIOD_MS: Record<PeriodPreset, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const STEP_MS: Record<TimeStep, number> = {
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

const HOUR_MS = STEP_MS["1h"];
const DAY_MS = STEP_MS["1d"];
const WEEK_MS = STEP_MS["1w"];
const GAP_PX = 3;
const LABEL_H = 16;

function normalizeStep(step?: string): TimeStep {
  return step === "1d" || step === "1w" || step === "1h" ? step : "1h";
}

const MAX_ROWS_PER_COLUMN = 48;

/**
 * Columns = parent time unit for the period:
 *   30d → weeks · 7d → days · 24h/1h → one column (whole period)
 * Step = cell size stacked top→bottom inside each column.
 * If a column would have too many rows (e.g. 30d + 1h), shrink the column unit.
 */
export function resolveActivityGrid(
  period: PeriodPreset,
  step: TimeStep
): { cols: number; rows: number; columnMs: number; stepMs: number } {
  const periodMs = PERIOD_MS[period];
  const stepMs = STEP_MS[step];

  let columnMs: number;
  switch (period) {
    case "30d":
      columnMs = WEEK_MS;
      break;
    case "7d":
      columnMs = DAY_MS;
      break;
    case "24h":
    case "1h":
    default:
      columnMs = periodMs;
      break;
  }

  // Prefer fewer, taller columns — but avoid absurd row counts.
  while (columnMs > stepMs && columnMs / stepMs > MAX_ROWS_PER_COLUMN) {
    if (columnMs >= WEEK_MS) columnMs = DAY_MS;
    else if (columnMs >= DAY_MS) columnMs = HOUR_MS;
    else break;
  }

  if (stepMs >= columnMs) {
    columnMs = stepMs;
  }

  const cols = Math.max(1, Math.ceil(periodMs / columnMs));
  const rows = Math.max(1, Math.round(columnMs / stepMs));

  return { cols, rows, columnMs, stepMs };
}

function mergeSeriesPoints(
  data: EventsTimeseriesWidgetData
): { at: string; value: number }[] {
  const byAt = new Map<string, number>();

  for (const series of data.series) {
    if (!("points" in series) || !Array.isArray(series.points)) continue;
    for (const point of series.points) {
      byAt.set(point.at, (byAt.get(point.at) ?? 0) + Number(point.value ?? 0));
    }
  }

  return Array.from(byAt.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([at, value]) => ({ at, value }));
}

/**
 * Chronological points laid out column-major:
 * top → bottom in a column, then next column to the right.
 */
export function buildActivityCells(
  data: EventsTimeseriesWidgetData,
  period: PeriodPreset
): { cells: ActivityCell[]; cols: number; rows: number; columnMs: number } {
  const step = normalizeStep(data.step);
  const { cols, rows, columnMs } = resolveActivityGrid(period, step);
  const expected = cols * rows;
  const sorted = mergeSeriesPoints(data);

  const window =
    sorted.length >= expected
      ? sorted.slice(sorted.length - expected)
      : [
          ...sorted,
          ...Array.from({ length: expected - sorted.length }, () => ({
            at: "",
            value: 0,
          })),
        ];

  const cells: ActivityCell[] = window.map((point, index) => ({
    ...point,
    col: Math.floor(index / rows),
    row: index % rows,
  }));

  return { cells, cols, rows, columnMs };
}

function intensityLevel(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  const ratio = value / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function formatValue(value: number, metric: WidgetMetric): string {
  void metric;
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatCellTime(iso: string, step: TimeStep): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (step === "1h") {
    return date.toLocaleString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (step === "1w") {
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatColumnLabel(
  iso: string,
  columnMs: number,
  cols: number,
  weekIndex: number
): string {
  if (!iso) return "";
  const date = new Date(iso);

  if (columnMs >= WEEK_MS) {
    // "12–18 jul" style from week start
    const end = new Date(date.getTime() + 6 * DAY_MS);
    const startLabel = date.toLocaleDateString(undefined, {
      day: "numeric",
      month: cols > 5 ? undefined : "short",
    });
    const endLabel = end.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
    return cols > 6 ? `S${weekIndex + 1}` : `${startLabel}–${endLabel}`;
  }

  if (columnMs >= DAY_MS) {
    if (cols > 10) {
      return date.toLocaleDateString(undefined, { day: "numeric" });
    }
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
    });
  }

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRowLabel(iso: string, step: TimeStep): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (step === "1h") return `${date.getHours()}h`;
  if (step === "1d") {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function ActivityCalendar({
  data,
  period,
  loading = false,
}: Props) {
  const t = useTranslations("Dashboard");
  const hostRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<ActivityCell | null>(null);

  const step = normalizeStep(data.step);
  const { cells, cols, rows, columnMs } = useMemo(
    () => buildActivityCells(data, period),
    [data, period]
  );

  const max = useMemo(
    () => cells.reduce((peak, cell) => Math.max(peak, cell.value), 0),
    [cells]
  );

  const lookup = useMemo(() => {
    const map = new Map<string, ActivityCell>();
    for (const cell of cells) {
      map.set(`${cell.row}-${cell.col}`, cell);
    }
    return map;
  }, [cells]);

  const columnLabels = useMemo(() => {
    return Array.from({ length: cols }, (_, col) => {
      const first = lookup.get(`0-${col}`);
      return formatColumnLabel(first?.at ?? "", columnMs, cols, col);
    });
  }, [cols, columnMs, lookup]);

  const showRowLabels = rows > 1 && rows <= 48;
  const rowLabelW = showRowLabels ? 28 : 0;

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    const update = () => {
      setBox({ width: node.clientWidth, height: node.clientHeight });
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const cellSize = useMemo(() => {
    const availW = Math.max(0, box.width - rowLabelW);
    const availH = Math.max(0, box.height - LABEL_H);
    if (availW <= 0 || availH <= 0 || cols <= 0 || rows <= 0) return 0;

    const cellW = (availW - GAP_PX * (cols - 1)) / cols;
    const cellH = (availH - GAP_PX * (rows - 1)) / rows;
    return Math.max(0, Math.min(cellW, cellH));
  }, [box.width, box.height, cols, rows, rowLabelW]);

  const gridWidth = cols * cellSize + GAP_PX * Math.max(0, cols - 1);
  const gridHeight = rows * cellSize + GAP_PX * Math.max(0, rows - 1);

  return (
    <div
      className={`flex h-full min-h-0 flex-col gap-2 rounded-lg border border-border-subtle bg-surface-0 p-2 transition-opacity ${
        loading ? "opacity-70" : ""
      }`}
    >
      <div ref={hostRef} className="relative min-h-0 flex-1">
        {cellSize > 0 && (
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: gridWidth + rowLabelW,
              height: gridHeight + LABEL_H,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Column labels */}
            <div
              className="mb-0 grid items-end"
              style={{
                marginLeft: rowLabelW,
                width: gridWidth,
                height: LABEL_H,
                gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                gap: GAP_PX,
              }}
            >
              {columnLabels.map((label, col) => (
                <span
                  key={col}
                  className="truncate text-center text-[9px] leading-none text-foreground-muted"
                  title={label}
                >
                  {cols <= 16 || col % Math.ceil(cols / 8) === 0 ? label : ""}
                </span>
              ))}
            </div>

            <div className="flex">
              {showRowLabels && (
                <div
                  className="flex shrink-0 flex-col justify-between pr-1"
                  style={{ width: rowLabelW, height: gridHeight }}
                >
                  {Array.from({ length: rows }, (_, row) => {
                    const sample = lookup.get(`${row}-0`);
                    const show =
                      rows <= 24 || row % Math.ceil(rows / 8) === 0;
                    return (
                      <span
                        key={row}
                        className="text-[9px] leading-none text-foreground-muted"
                        style={{ height: cellSize }}
                      >
                        {show ? formatRowLabel(sample?.at ?? "", step) : ""}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Column-major visual: CSS grid is row-major visually as
                  row×col, data is already indexed col-major chronologically. */}
              <div
                className="grid"
                style={{
                  width: gridWidth,
                  height: gridHeight,
                  gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                  gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
                  gap: GAP_PX,
                }}
              >
                {Array.from({ length: rows }, (_, row) =>
                  Array.from({ length: cols }, (_, col) => {
                    const cell = lookup.get(`${row}-${col}`);
                    const value = cell?.value ?? 0;
                    const level = intensityLevel(value, max);

                    return (
                      <button
                        key={`${row}-${col}`}
                        type="button"
                        className={`rounded-[2px] ${LEVEL_CLASSES[level]} hover:ring-1 hover:ring-foreground/40`}
                        title={
                          cell?.at
                            ? `${formatCellTime(cell.at, step)} — ${formatValue(value, data.metric)}`
                            : formatValue(value, data.metric)
                        }
                        onMouseEnter={() =>
                          cell ? setHovered(cell) : setHovered(null)
                        }
                        onMouseLeave={() => setHovered(null)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-[10px] text-foreground-muted">
        <p className="min-w-0 truncate tabular-nums">
          {hovered?.at
            ? `${formatCellTime(hovered.at, step)} — ${formatValue(hovered.value, data.metric)}`
            : data.series.length > 1
              ? t("activitySeriesSumHint")
              : "\u00a0"}
        </p>
        <div className="flex items-center gap-1">
          <span>{t("activityLegendLess")}</span>
          {LEVEL_CLASSES.map((className) => (
            <span
              key={className}
              className={`h-2.5 w-2.5 rounded-[2px] ${className}`}
            />
          ))}
          <span>{t("activityLegendMore")}</span>
        </div>
      </div>
    </div>
  );
}
