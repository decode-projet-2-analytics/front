"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Application } from "@/lib/applicationsApi";
import ApplicationSelector from "./ApplicationSelector";
import WidgetGrid from "./WidgetGrid";
import AddWidgetModal from "./builder/AddWidgetModal";
import { useWidgetPolling } from "./hooks/useWidgetPolling";

interface Props {
  applications: Application[];
  defaultApplicationId: number | null;
}

export default function DashboardView({
  applications,
  defaultApplicationId,
}: Props) {
  const t = useTranslations("Dashboard");
  const [applicationId, setApplicationId] = useState<number | null>(
    defaultApplicationId
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [gridRefresh, setGridRefresh] = useState(0);
  const [lastDataRefresh, setLastDataRefresh] = useState<string | null>(null);
  const pollTick = useWidgetPolling(10_000);

  const canAddWidget = applicationId !== null;
  const showLive = applicationId !== null;

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
      })
    );
  }, [pollTick, showLive]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{t("title")}</h2>
            {showLive && (
              <span
                key={pollTick}
                className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success animate-pulse"
              >
                <span className="h-2 w-2 rounded-full bg-success" />
                {t("live")}
              </span>
            )}
          </div>
          {showLive && lastDataRefresh && (
            <p className="text-xs text-foreground-muted">
              {t("lastRefresh", { time: lastDataRefresh })}
            </p>
          )}
        </div>
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
      </header>

      <div className="mb-6 max-w-xs">
        <ApplicationSelector
          applications={applications}
          value={applicationId}
          onChange={setApplicationId}
        />
      </div>

      <WidgetGrid
        applicationId={applicationId}
        refreshToken={gridRefresh}
        pollTick={pollTick}
        onRefresh={() => setGridRefresh((n) => n + 1)}
      />

      {applicationId !== null && (
        <AddWidgetModal
          open={modalOpen}
          applicationId={applicationId}
          onClose={() => setModalOpen(false)}
          onCreated={() => setGridRefresh((n) => n + 1)}
        />
      )}
    </div>
  );
}
