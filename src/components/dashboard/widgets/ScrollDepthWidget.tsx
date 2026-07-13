"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchWidgetData,
  type ScrollDepthWidgetData,
  type Widget,
} from "@/lib/dashboardApi";
import { WidgetContentSkeleton } from "../WidgetSkeleton";

interface Props {
  widget: Widget;
  refreshKey?: number;
  liveData?: ScrollDepthWidgetData | null;
}

function isScrollDepthData(data: unknown): data is ScrollDepthWidgetData {
  return (
    typeof data === "object" &&
    data !== null &&
    "buckets" in data &&
    "average" in data &&
    Array.isArray((data as ScrollDepthWidgetData).buckets)
  );
}

export default function ScrollDepthWidget({
  widget,
  refreshKey = 0,
  liveData = null,
}: Props) {
  const t = useTranslations("Dashboard");
  const [data, setData] = useState<ScrollDepthWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (liveData && isScrollDepthData(liveData)) {
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

      if (!isScrollDepthData(result)) {
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

  if (loading && !data) {
    return <WidgetContentSkeleton type="scroll_depth" />;
  }

  if (error && !data) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-error">
        {t("scrollDepthError")}
      </div>
    );
  }

  if (!data || data.sessionsTracked === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
        {t("scrollDepthNoData")}
      </div>
    );
  }

  const maxSessions = data.buckets.reduce(
    (peak, bucket) => Math.max(peak, bucket.sessions),
    0
  );

  return (
    <div
      className={`flex w-full flex-col gap-3 rounded-lg border border-border-subtle bg-surface-0 p-3 transition-opacity ${loading ? "opacity-70" : ""}`}
    >
      <div className="flex items-baseline gap-2 border-b border-border-subtle pb-3">
        <span className="text-3xl font-semibold tabular-nums">
          {Math.round(data.average)}%
        </span>
        <span className="text-xs text-foreground-muted">
          {t("scrollDepthAverage")}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {data.buckets.map((bucket) => {
          const width =
            maxSessions > 0
              ? Math.max(2, (bucket.sessions / maxSessions) * 100)
              : 0;
          return (
            <div key={bucket.range} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-foreground-secondary">{bucket.range}%</span>
                <span className="shrink-0 tabular-nums text-foreground">
                  {bucket.sessions.toLocaleString()}
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

      <p className="text-[10px] text-foreground-muted">
        {t("scrollDepthSessions", { count: data.sessionsTracked })}
      </p>
    </div>
  );
}
