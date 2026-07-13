"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  fetchWidgetData,
  type FunnelWidgetData,
  type Widget,
} from "@/lib/dashboardApi";
import { WidgetContentSkeleton } from "../WidgetSkeleton";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Props {
  widget: Widget;
  refreshKey?: number;
  liveData?: FunnelWidgetData | null;
}

function isFunnelData(data: unknown): data is FunnelWidgetData {
  return (
    typeof data === "object" &&
    data !== null &&
    "steps" in data &&
    Array.isArray((data as FunnelWidgetData).steps) &&
    "dropOff" in data &&
    Array.isArray((data as FunnelWidgetData).dropOff) &&
    "conversionRate" in data
  );
}

function hasFunnelSessions(data: FunnelWidgetData): boolean {
  return data.steps.some((step) => step.count > 0);
}

export default function FunnelWidget({
  widget,
  refreshKey = 0,
  liveData = null,
}: Props) {
  const t = useTranslations("Dashboard");
  const [data, setData] = useState<FunnelWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (liveData && isFunnelData(liveData)) {
      setData(liveData);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchWidgetData(widget.id).then((result) => {
      if (cancelled) return;

      if (!isFunnelData(result)) {
        setError(t("funnelLoadError"));
      } else {
        setData(result);
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [widget.id, widget.updatedAt, refreshKey, liveData, t]);

  const chartData = useMemo(() => {
    if (!data) return null;

    return {
      labels: data.steps.map((step) => step.label || step.slug),
      datasets: [
        {
          label: t("funnelSessions"),
          data: data.steps.map((step) => step.count),
          backgroundColor: "rgba(102, 115, 255, 0.65)",
          borderRadius: 4,
        },
      ],
    };
  }, [data, t]);

  if (loading && !data) {
    return <WidgetContentSkeleton type="funnel" />;
  }

  if (error && !data) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-error">
        {error}
      </div>
    );
  }

  if (!data || !chartData || data.steps.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
        {t("funnelNeedsTunnel")}
      </div>
    );
  }

  if (!hasFunnelSessions(data)) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
        {t("funnelNoSessions")}
      </div>
    );
  }

  return (
    <div
      className={`flex h-full min-h-0 flex-col gap-3 rounded-lg border border-border-subtle bg-surface-0 p-3 transition-opacity ${loading ? "opacity-70" : ""}`}
    >
      <div className="flex shrink-0 items-baseline justify-between gap-2">
        <p className="text-sm text-foreground-muted">{data.tunnelName}</p>
        <p className="text-sm font-medium">
          {t("funnelConversion", {
            rate: Math.round(data.conversionRate * 1000) / 10,
          })}
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <Bar
          data={chartData}
          options={{
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                beginAtZero: true,
                ticks: { color: "#71717a", precision: 0 },
                grid: { color: "rgba(39, 39, 47, 0.6)" },
              },
              y: {
                ticks: { color: "#71717a" },
                grid: { color: "rgba(39, 39, 47, 0.6)" },
              },
            },
          }}
        />
      </div>
      {data.dropOff.length > 0 && (
        <ul className="shrink-0 space-y-1 text-xs text-foreground-muted">
          {data.dropOff.map((dropOff) => (
            <li key={`${dropOff.fromIndex}-${dropOff.toIndex}`}>
              {t("funnelDropOff", {
                from:
                  data.steps[dropOff.fromIndex]?.label ?? dropOff.fromIndex,
                to: data.steps[dropOff.toIndex]?.label ?? dropOff.toIndex,
                lost: dropOff.lost,
                rate: Math.round(dropOff.rate * 1000) / 10,
              })}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
