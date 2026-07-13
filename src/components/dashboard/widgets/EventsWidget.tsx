"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type Chart,
  type ChartOptions,
  type LegendElement,
  type LegendItem,
  type TooltipItem,
} from "chart.js";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import {
  fetchWidgetData,
  type EventVisualization,
  type EventsTimeseriesWidgetData,
  type EventsWidgetData,
  type Widget,
  type WidgetMetric,
} from "@/lib/dashboardApi";
import {
  inferPeriod,
  normalizeEventVisualization,
} from "../builder/widgetConfigUtils";
import { WidgetContentSkeleton } from "../WidgetSkeleton";
import ActivityCalendar from "./ActivityCalendar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

const CHART_COLORS = [
  "#6673ff",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#eab308",
];

interface Props {
  widget: Widget;
  refreshKey?: number;
  liveData?: EventsWidgetData | null;
}

function isEventsData(data: unknown): data is EventsWidgetData {
  if (typeof data !== "object" || data === null || !("visualization" in data)) {
    return false;
  }

  const candidate = data as EventsWidgetData;
  if (!Array.isArray(candidate.series)) return false;

  const viz = normalizeEventVisualization(candidate.visualization);
  return (
    viz === "nombre" ||
    viz === "line" ||
    viz === "bar" ||
    viz === "pie" ||
    viz === "doughnut" ||
    viz === "activity"
  );
}

function formatValue(value: number, metric: WidgetMetric): string {
  void metric;
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatPercent(value: number, total: number): string {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return `${pct.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })} %`;
}

const LEGEND_TEXT_COLOR = "#a1a1aa";

function visibleSegmentTotal(chart: Chart, values: number[]): number {
  return values.reduce((sum, value, index) => {
    return chart.getDataVisibility(index) ? sum + value : sum;
  }, 0);
}

function proportionChartOptions(): ChartOptions<"pie" | "doughnut"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: LEGEND_TEXT_COLOR,
          generateLabels(chart): LegendItem[] {
            const dataset = chart.data.datasets[0];
            const values = (dataset?.data ?? []).map((value) => Number(value));
            const visibleTotal = visibleSegmentTotal(chart, values);
            const colors = Array.isArray(dataset?.backgroundColor)
              ? dataset.backgroundColor
              : [];
            const borders = Array.isArray(dataset?.borderColor)
              ? dataset.borderColor
              : [];

            return (chart.data.labels ?? []).map((label, index) => {
              const value = values[index] ?? 0;
              const hidden = !chart.getDataVisibility(index);

              return {
                text: hidden
                  ? String(label)
                  : `${String(label)} · ${formatPercent(value, visibleTotal)}`,
                fillStyle: String(colors[index] ?? "#6673ff"),
                strokeStyle: String(borders[index] ?? "#6673ff"),
                fontColor: LEGEND_TEXT_COLOR,
                lineWidth: 1,
                hidden,
                index,
                datasetIndex: 0,
              };
            });
          },
        },
        onClick(
          _event,
          legendItem: LegendItem,
          legend: LegendElement<"pie" | "doughnut">,
        ) {
          const index = legendItem.index;
          if (index == null) return;
          legend.chart.toggleDataVisibility(index);
          legend.chart.update();
        },
      },
      tooltip: {
        callbacks: {
          label(context: TooltipItem<"pie" | "doughnut">) {
            const chart = context.chart;
            const values = context.dataset.data.map((value) => Number(value));
            const visibleTotal = visibleSegmentTotal(chart, values);
            const value = Number(context.raw ?? 0);
            const name = context.label ?? "";
            return `${name}: ${value.toLocaleString()} (${formatPercent(value, visibleTotal)})`;
          },
        },
      },
    },
  };
}

function formatLabel(iso: string, step: string): string {
  const date = new Date(iso);

  if (step === "1d" || step === "1w") {
    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    });
  }

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hasSeriesValues(data: EventsWidgetData): boolean {
  const viz = normalizeEventVisualization(data.visualization);
  if (viz === "line" || viz === "activity") {
    return data.series.some(
      (series) =>
        "points" in series &&
        Array.isArray(series.points) &&
        series.points.some((point) => point.value !== 0),
    );
  }

  return data.series.some(
    (series) =>
      "value" in series &&
      typeof series.value === "number" &&
      series.value !== 0,
  );
}

function categoricalColors(count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => `${CHART_COLORS[index % CHART_COLORS.length]}cc`,
  );
}

export default function EventsWidget({
  widget,
  refreshKey = 0,
  liveData = null,
}: Props) {
  const t = useTranslations("Dashboard");
  const [data, setData] = useState<EventsWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchWidgetData(widget.id).then((result) => {
      if (cancelled) return;

      if (!isEventsData(result)) {
        setError(true);
      } else {
        setData(result);
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [widget.id, widget.updatedAt, refreshKey]);

  useEffect(() => {
    if (liveData && isEventsData(liveData)) {
      setData(liveData);
      setLoading(false);
      setError(false);
    }
  }, [liveData]);

  const visualization: EventVisualization = data
    ? normalizeEventVisualization(data.visualization)
    : "nombre";

  const categoricalChartData = useMemo(() => {
    if (
      !data ||
      visualization === "line" ||
      visualization === "activity" ||
      visualization === "nombre"
    ) {
      return null;
    }

    const values = data.series.filter(
      (series): series is { name: string; value: number } =>
        "value" in series && typeof series.value === "number",
    );

    return {
      labels: values.map((series) => series.name),
      datasets: [
        {
          label: t(`metric_${data.metric}`),
          data: values.map((series) => series.value),
          backgroundColor: categoricalColors(values.length),
          borderColor: values.map(
            (_, index) => CHART_COLORS[index % CHART_COLORS.length],
          ),
          borderWidth: 1,
          borderRadius: visualization === "bar" ? 4 : 0,
        },
      ],
    };
  }, [data, t, visualization]);

  const lineChartData = useMemo(() => {
    if (!data || visualization !== "line") return null;

    const pointTimes = Array.from(
      new Set(
        data.series.flatMap((series) =>
          "points" in series && Array.isArray(series.points)
            ? series.points.map((point) => point.at)
            : [],
        ),
      ),
    ).sort();

    return {
      labels: pointTimes.map((at) =>
        formatLabel(at, "step" in data && data.step ? data.step : "1h"),
      ),
      datasets: data.series.map((series, index) => {
        const points =
          "points" in series && Array.isArray(series.points)
            ? series.points
            : [];
        const pointsByTime = new Map(
          points.map((point) => [point.at, point.value]),
        );

        return {
          label: series.name,
          data: pointTimes.map((at) => pointsByTime.get(at) ?? 0),
          borderColor: CHART_COLORS[index % CHART_COLORS.length],
          backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}26`,
          tension: 0.3,
          fill: false,
          pointRadius: pointTimes.length > 48 ? 0 : 3,
          pointHoverRadius: 4,
        };
      }),
    };
  }, [data, visualization]);

  if (loading && !data) {
    return <WidgetContentSkeleton type="events" />;
  }

  if (error && !data) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-error">
        {t("eventsLoadError")}
      </div>
    );
  }

  if (!data || data.series.length === 0) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
        {t("eventsNoData")}
      </div>
    );
  }

  if (visualization === "nombre") {
    const period = inferPeriod(widget.config?.timeRange);
    const valueSeries = data.series.filter(
      (series): series is { name: string; value: number } =>
        "value" in series && typeof series.value === "number",
    );
    const single = valueSeries.length === 1 ? valueSeries[0] : null;

    if (single) {
      return (
        <div
          className={`flex h-full min-h-0 flex-col overflow-auto rounded-lg border border-border-subtle bg-surface-0 p-4 transition-opacity [container-type:size] ${
            loading ? "opacity-70" : ""
          }`}
        >
          <p className="shrink-0 text-xs text-foreground-muted">
            {t(`period_${period}`)}
          </p>
          <div className="flex min-h-0 flex-1 flex-col items-start justify-center gap-2 py-2">
            {single.name !== "All" && (
              <p className="max-w-full text-sm leading-snug text-foreground-muted break-words">
                {single.name}
              </p>
            )}
            <p className="font-semibold tabular-nums leading-none tracking-tight text-[clamp(2.25rem,28cqh,4.5rem)]">
              {formatValue(single.value, data.metric)}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex h-full min-h-0 flex-col gap-2 overflow-auto rounded-lg border border-border-subtle bg-surface-0 p-3 transition-opacity [container-type:size] ${
          loading ? "opacity-70" : ""
        }`}
      >
        <p className="shrink-0 text-xs text-foreground-muted">
          {t(`period_${period}`)}
        </p>
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {valueSeries.map((series) => (
            <div
              key={series.name}
              className="flex min-h-[4.5rem] flex-1 flex-col justify-center gap-1 overflow-hidden rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 sm:px-4 sm:py-3"
            >
              <p className="shrink-0 text-sm leading-snug text-foreground-muted break-words">
                {series.name}
              </p>
              <p className="min-w-0 font-semibold tabular-nums leading-none text-[clamp(1.5rem,14cqh,3rem)]">
                {formatValue(series.value, data.metric)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visualization === "activity") {
    return (
      <ActivityCalendar
        data={data as EventsTimeseriesWidgetData}
        period={inferPeriod(widget.config?.timeRange)}
        loading={loading}
      />
    );
  }

  if (!hasSeriesValues(data)) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
        {t("eventsNoData")}
      </div>
    );
  }

  const chartClassName = `h-full min-h-0 rounded-lg border border-border-subtle bg-surface-0 p-3 transition-opacity ${
    loading ? "opacity-70" : ""
  }`;

  if (visualization === "line" && lineChartData) {
    return (
      <div className={chartClassName}>
        <Line
          data={lineChartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: data.series.length > 1 } },
            scales: {
              x: {
                ticks: {
                  color: "#71717a",
                  maxTicksLimit: 8,
                  maxRotation: 0,
                },
                grid: { color: "rgba(39, 39, 47, 0.6)" },
              },
              y: {
                beginAtZero: true,
                ticks: { color: "#71717a", precision: 0 },
                grid: { color: "rgba(39, 39, 47, 0.6)" },
              },
            },
          }}
        />
      </div>
    );
  }

  if (!categoricalChartData) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
        {t("eventsNoData")}
      </div>
    );
  }

  if (visualization === "bar") {
    return (
      <div className={chartClassName}>
        <Bar
          data={categoricalChartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                ticks: { color: "#71717a" },
                grid: { color: "rgba(39, 39, 47, 0.6)" },
              },
              y: {
                beginAtZero: true,
                ticks: { color: "#71717a", precision: 0 },
                grid: { color: "rgba(39, 39, 47, 0.6)" },
              },
            },
          }}
        />
      </div>
    );
  }

  if (visualization === "pie") {
    return (
      <div className={chartClassName}>
        <Pie
          data={categoricalChartData}
          options={proportionChartOptions() as ChartOptions<"pie">}
        />
      </div>
    );
  }

  if (visualization === "doughnut") {
    return (
      <div className={chartClassName}>
        <Doughnut
          data={categoricalChartData}
          options={proportionChartOptions() as ChartOptions<"doughnut">}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
      {t("eventsNoData")}
    </div>
  );
}
