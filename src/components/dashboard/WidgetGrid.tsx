"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchWidgets, type Widget } from "@/lib/dashboardApi";
import DashboardGrid from "./grid/DashboardGrid";
import { WidgetCardSkeleton } from "./WidgetSkeleton";

interface Props {
  applicationId: number | null;
  refreshToken?: number;
  pollTick?: number;
  dataByWidgetId?: Record<number, unknown>;
  onRefresh?: () => void;
}

export default function WidgetGrid({
  applicationId,
  refreshToken = 0,
  pollTick = 0,
  dataByWidgetId,
  onRefresh,
}: Props) {
  const t = useTranslations("Dashboard");
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!applicationId) {
      hasLoadedRef.current = false;
      setWidgets([]);
      return;
    }

    let cancelled = false;

    if (!hasLoadedRef.current) {
      setLoading(true);
      setError(false);
    }

    fetchWidgets(applicationId)
      .then((data) => {
        if (!cancelled) {
          setWidgets(data);
          hasLoadedRef.current = true;
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applicationId, refreshToken]);

  if (!applicationId) return null;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <WidgetCardSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-error">{t("loadError")}</p>;
  }

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-1 px-6 py-16 text-center">
        <p className="text-lg font-medium">{t("noWidgets")}</p>
        <p className="mt-2 max-w-sm text-sm text-foreground-muted">
          {t("noWidgetsHint")}
        </p>
      </div>
    );
  }

  return (
    <DashboardGrid
      widgets={widgets}
      refreshKey={pollTick}
      dataByWidgetId={dataByWidgetId}
      onRefresh={onRefresh}
    />
  );
}
