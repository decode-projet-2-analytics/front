"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  fetchWidgetData,
  type TimeseriesWidgetData,
  type Widget,
} from "@/lib/dashboardApi";
import { WidgetContentSkeleton } from "../WidgetSkeleton";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

interface Props {
  widget: Widget;
  refreshKey?: number;
}

function isTimeseriesData(data: unknown): data is TimeseriesWidgetData {
  return (
    typeof data === "object" &&
    data !== null &&
    "points" in data &&
    Array.isArray((data as TimeseriesWidgetData).points)
  );
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

export default function TimeseriesWidget({ widget, refreshKey = 0 }: Props) {
  const t = useTranslations("Dashboard");
  const [data, setData] = useState<TimeseriesWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const isInitialLoad = data === null && !error;

    if (isInitialLoad) {
      setLoading(true);
    }

    setError(false);

    fetchWidgetData(widget.id).then((result) => {
      if (cancelled) return;

      if (!isTimeseriesData(result)) {
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

  const chartData = useMemo(() => {
    if (!data) return null;

    return {
      labels: data.points.map((point) => formatLabel(point.at, data.step)),
      datasets: [
        {
          data: data.points.map((point) => point.value),
          borderColor: "#6673ff",
          backgroundColor: "rgba(102, 115, 255, 0.15)",
          fill: true,
          tension: 0.3,
          pointRadius: data.points.length > 48 ? 0 : 3,
          pointHoverRadius: 4,
        },
      ],
    };
  }, [data]);

  if (loading && !chartData) {
    return <WidgetContentSkeleton type="timeseries" />;
  }

  if (error && !chartData) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-error">
        {t("timeseriesError")}
      </div>
    );
  }

  if (!data || data.points.every((point) => point.value === 0)) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
        {t("timeseriesNoData")}
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
        {t("timeseriesNoData")}
      </div>
    );
  }

  return (
    <div
      className={`h-48 rounded-lg border border-border-subtle bg-surface-0 p-3 transition-opacity ${loading ? "opacity-70" : ""}`}
    >
      <Line
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
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
