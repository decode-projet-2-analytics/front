"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchWidgetData,
  type BreakdownWidgetData,
  type Widget,
  type WidgetMetric,
} from "@/lib/dashboardApi";
import { WidgetContentSkeleton } from "../WidgetSkeleton";

interface Props {
  widget: Widget;
  liveData?: BreakdownWidgetData | null;
}

function isBreakdownData(data: unknown): data is BreakdownWidgetData {
  return (
    typeof data === "object" &&
    data !== null &&
    "rows" in data &&
    Array.isArray((data as BreakdownWidgetData).rows)
  );
}

function formatValue(value: number, metric: WidgetMetric): string {
  if (metric === "rate") {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/** Shorten a full URL to its path for readability; leave other keys as-is. */
function formatKey(key: string): string {
  if (!key) return "—";
  try {
    const url = new URL(key);
    return (url.pathname + url.search) || "/";
  } catch {
    return key;
  }
}

export default function BreakdownWidget({
  widget,
  liveData = null,
}: Props) {
  const t = useTranslations("Dashboard");
  const [data, setData] = useState<BreakdownWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (liveData && isBreakdownData(liveData)) {
      setData(liveData);
      setLoading(false);
      setError(false);
    }
  }, [liveData]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchWidgetData(widget.id).then((result) => {
      if (cancelled) return;

      if (!isBreakdownData(result)) {
        setError(true);
      } else {
        setData(result);
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [widget.id, widget.updatedAt]);

  if (loading && !data) {
    return <WidgetContentSkeleton type="breakdown" />;
  }

  if (error && !data) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-error">
        {t("breakdownError")}
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
        {t("breakdownNoData")}
      </div>
    );
  }

  const max = data.rows.reduce((peak, row) => Math.max(peak, row.value), 0);

  return (
    <div
      className={`flex w-full flex-col gap-2 rounded-lg border border-border-subtle bg-surface-0 p-3 transition-opacity ${loading ? "opacity-70" : ""}`}
    >
      {data.rows.map((row, index) => {
        const width = max > 0 ? Math.max(2, (row.value / max) * 100) : 0;
        return (
          <div key={`${row.key}-${index}`} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-foreground-secondary" title={row.key}>
                {formatKey(row.key)}
              </span>
              <span className="shrink-0 tabular-nums text-foreground">
                {formatValue(row.value, data.metric)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
