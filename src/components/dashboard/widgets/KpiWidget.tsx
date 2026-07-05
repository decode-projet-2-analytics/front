"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchWidgetData, type KpiWidgetData, type Widget } from "@/lib/dashboardApi";
import { WidgetContentSkeleton } from "../WidgetSkeleton";

interface Props {
  widget: Widget;
  refreshKey?: number;
}

function isKpiData(data: unknown): data is KpiWidgetData {
  return (
    typeof data === "object" &&
    data !== null &&
    "value" in data &&
    !("points" in data) &&
    !("cells" in data)
  );
}

function formatValue(value: number, metric: Widget["config"]["metric"]): string {
  if (metric === "rate") {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

export default function KpiWidget({ widget, refreshKey = 0 }: Props) {
  const t = useTranslations("Dashboard");
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const isInitialLoad = value === null && !error;

    if (isInitialLoad) {
      setLoading(true);
    }

    setError(false);

    fetchWidgetData(widget.id).then((data) => {
      if (cancelled) return;

      if (!isKpiData(data)) {
        setError(true);
        if (isInitialLoad) setValue(null);
      } else {
        setValue(data.value);
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [widget.id, widget.updatedAt, refreshKey]);

  if (loading && value === null) {
    return <WidgetContentSkeleton type="kpi" />;
  }

  if (error && value === null) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-error">
        {t("kpiError")}
      </div>
    );
  }

  if (value == null) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
        {t("kpiNoData")}
      </div>
    );
  }

  return (
    <div
      className={`flex h-32 flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-0 transition-opacity ${loading ? "opacity-70" : ""}`}
    >
      <p className="text-4xl font-semibold tabular-nums">
        {formatValue(value, widget.config.metric)}
      </p>
      <p className="mt-2 text-xs text-foreground-muted">
        {t(`metric_${widget.config.metric}`)}
      </p>
    </div>
  );
}
