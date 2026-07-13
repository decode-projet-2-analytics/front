"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchWidgetData,
  type RetentionWidgetData,
  type Widget,
} from "@/lib/dashboardApi";
import { WidgetContentSkeleton } from "../WidgetSkeleton";

interface Props {
  widget: Widget;
  refreshKey?: number;
}

function isRetentionData(data: unknown): data is RetentionWidgetData {
  return (
    typeof data === "object" &&
    data !== null &&
    "rate" in data &&
    "returning" in data &&
    "total" in data
  );
}

export default function RetentionWidget({ widget, refreshKey = 0 }: Props) {
  const t = useTranslations("Dashboard");
  const [data, setData] = useState<RetentionWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchWidgetData(widget.id).then((result) => {
      if (cancelled) return;

      if (!isRetentionData(result)) {
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
    return <WidgetContentSkeleton type="retention" />;
  }

  if (error && !data) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-error">
        {t("retentionError")}
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
        {t("retentionNoData")}
      </div>
    );
  }

  return (
    <div
      className={`flex h-32 flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-0 transition-opacity ${loading ? "opacity-70" : ""}`}
    >
      <p className="text-4xl font-semibold tabular-nums">
        {Math.round(data.rate)}%
      </p>
      <p className="mt-1 text-xs text-foreground-muted">{t("retentionLabel")}</p>
      <p className="mt-2 text-[11px] text-foreground-secondary">
        {t("retentionDetail", {
          returning: data.returning,
          total: data.total,
        })}
      </p>
    </div>
  );
}
