"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Application, ApplicationTeamRole } from "@/lib/applicationsApi";
import type { Widget } from "@/lib/dashboardApi";
import ApplicationSelector from "./ApplicationSelector";
import WidgetGrid from "./WidgetGrid";
import AddWidgetModal from "./builder/AddWidgetModal";
import WidgetConfigModal from "./builder/WidgetConfigModal";
import { useAnalyticsSocket } from "./hooks/useAnalyticsSocket";
import { useWidgetPolling } from "./hooks/useWidgetPolling";

const EMPTY_WIDGET_DATA: Record<number, unknown> = {};

interface Props {
  applications: Application[];
  defaultApplicationId: number | null;
  roleByApplication: Record<number, ApplicationTeamRole | null>;
}

export default function DashboardView({
  applications,
  defaultApplicationId,
  roleByApplication,
}: Props) {
  const t = useTranslations("Dashboard");
  const [applicationId, setApplicationId] = useState<number | null>(
    defaultApplicationId,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [configWidget, setConfigWidget] = useState<Widget | null>(null);
  const [gridRefresh, setGridRefresh] = useState(0);
  const [lastDataRefresh, setLastDataRefresh] = useState<string | null>(null);
  const { connectionState, dataByWidgetId, lastPushAt } =
    useAnalyticsSocket(applicationId);
  const isLiveConnected = connectionState === "connected";
  const pollTick = useWidgetPolling(isLiveConnected ? 0 : 10_000);

  const applicationRole = applicationId ? roleByApplication[applicationId] : null;
  const canManageWidgets = applicationRole === "owner" || applicationRole === "admin";
  const canAddWidget = applicationId !== null && canManageWidgets;
  const showLive = applicationId !== null;
  const liveDataByWidgetId = isLiveConnected
    ? dataByWidgetId
    : EMPTY_WIDGET_DATA;

  function handleApplicationChange(id: number | null) {
    setApplicationId(id);
    const url = new URL(window.location.href);
    if (id == null) url.searchParams.delete("applicationId");
    else url.searchParams.set("applicationId", String(id));
    window.history.replaceState(null, "", url.toString());
  }

  useEffect(() => {
    if (!showLive) {
      setLastDataRefresh(null);
      return;
    }

    setLastDataRefresh(
      new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  }, [pollTick, lastPushAt, showLive]);

  return (
    <div className="flex flex-1 flex-col">
      <section className="sticky top-0 z-10 w-full border-b border-border-subtle bg-surface-0 p-0">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-row items-center gap-3">
            <ApplicationSelector
              applications={applications}
              value={applicationId}
              onChange={handleApplicationChange}
            />
            {applicationId !== null && (
              <Link
                href={`/applications/${applicationId}`}
                className="mb-0.5 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                {t("configureApp")}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            {showLive && (
              <div className="flex flex-col gap-0.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                    isLiveConnected
                      ? "border-success/30 bg-success/10 text-success animate-pulse"
                      : "border-border-subtle bg-surface-2 text-foreground-muted"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isLiveConnected ? "bg-success" : "bg-foreground-muted"
                    }`}
                  />
                  {t("live")}
                </span>
                {lastDataRefresh && (
                  <p className="text-xs text-foreground-muted">
                    {t("lastRefresh", { time: lastDataRefresh })}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={!canAddWidget}
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              {t("addWidget")}
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <WidgetGrid
          applicationId={applicationId}
        canManageWidgets={canManageWidgets}
          refreshToken={gridRefresh}
          pollTick={pollTick}
          dataByWidgetId={liveDataByWidgetId}
          onRefresh={() => setGridRefresh((n) => n + 1)}
        />
      </div>

      {applicationId !== null && (
        <AddWidgetModal
          open={modalOpen}
          applicationId={applicationId}
          onClose={() => setModalOpen(false)}
          onCreated={(widget) => {
            setGridRefresh((n) => n + 1);
            setConfigWidget(widget);
          }}
        />
      )}

      {configWidget && (
        <WidgetConfigModal
          open
          widget={configWidget}
          onClose={() => {
            setConfigWidget(null);
            setGridRefresh((n) => n + 1);
          }}
          onUpdated={() => {
            setConfigWidget(null);
            setGridRefresh((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
