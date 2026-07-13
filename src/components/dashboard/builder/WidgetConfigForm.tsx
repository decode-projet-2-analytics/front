"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  updateWidget,
  type EventVisualization,
  type Tag,
  type Widget,
  type WidgetConfig,
  type WidgetMetric,
} from "@/lib/dashboardApi";
import type { WidgetSeries } from "@/lib/metadataFilters";
import type { TrackedPage } from "@/lib/mouseHeatmapApi";
import type { Tunnel } from "@/lib/tunnelsApi";
import SeriesEditor from "../filters/SeriesEditor";
import {
  EVENT_VISUALIZATIONS,
  EVENT_METRICS,
  MOUSE_PERIODS,
  BREAKDOWN_DIMENSIONS,
  PERIOD_PRESETS,
  TIME_STEPS,
  buildEventsConfig,
  buildFunnelConfig,
  buildMouseConfig,
  buildWidgetConfig,
  inferPeriod,
  readEventSeries,
  readEventVisualization,
  readEventType,
  readEventsTagId,
  readGroupBy,
  readMousePage,
  readMousePeriod,
  readTagId,
  readTunnelId,
  readBreakdownMetric,
  normalizeWidgetMetric,
  type BreakdownDimension,
  type MousePeriod,
  type PeriodPreset,
  type TimeStep,
} from "./widgetConfigUtils";

const fieldClass =
  "rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm outline-none focus:border-white focus:outline-none focus:ring-0";

const EMPTY_TRACKED_PAGES: TrackedPage[] = [];

function pageLabel(page: string): string {
  try {
    const url = new URL(page);
    return url.pathname + url.search;
  } catch {
    return page;
  }
}

interface Props {
  widget: Widget;
  tags: Tag[];
  tunnels: Tunnel[];
  trackedPages?: TrackedPage[];
  loadingTrackedPages?: boolean;
  onMousePeriodChange?: (period: MousePeriod) => void;
  onSaved: () => void;
  onCancel: () => void;
}

export default function WidgetConfigForm({
  widget,
  tags,
  tunnels,
  trackedPages = EMPTY_TRACKED_PAGES,
  loadingTrackedPages = false,
  onMousePeriodChange,
  onSaved,
  onCancel,
}: Props) {
  const t = useTranslations("Dashboard");
  const isFunnel = widget.type === "funnel";
  const isMouse = widget.type === "mouse_heatmap";
  const isEvents = widget.type === "events";
  const isBreakdown = widget.type === "breakdown";
  const isScrollDepth = widget.type === "scroll_depth";
  const [period, setPeriod] = useState<PeriodPreset>(() =>
    inferPeriod(widget.config?.timeRange)
  );
  const [title, setTitle] = useState(widget.title);
  const [step, setStep] = useState<TimeStep>(
    (widget.config?.timeRange?.step as TimeStep) || "1h"
  );
  const [metric, setMetric] = useState<WidgetMetric>(() => {
    if (widget.type === "breakdown") {
      return readBreakdownMetric(widget.config?.metric);
    }
    return normalizeWidgetMetric(widget.config?.metric);
  });
  const [eventType, setEventType] = useState(() =>
    readEventType(widget.config?.filters)
  );
  const [eventVisualization, setEventVisualization] =
    useState<EventVisualization>(() => readEventVisualization(widget.config));
  const [eventTagId, setEventTagId] = useState<number | "">(() =>
    readEventsTagId(widget.config)
  );
  const [eventSeries, setEventSeries] = useState<WidgetSeries[]>(() =>
    readEventSeries(widget.config)
  );
  const [tagId, setTagId] = useState<number | "">(
    readTagId(widget.config?.filters) ?? ""
  );
  const [tunnelId, setTunnelId] = useState<number | "">(() =>
    readTunnelId(widget.config)
  );
  const [mousePeriod, setMousePeriod] = useState<MousePeriod>(() =>
    readMousePeriod(widget.config)
  );
  const [mousePage, setMousePage] = useState<string | "">(() => {
    const page = readMousePage(widget.config);
    return page ?? "";
  });
  const [groupBy, setGroupBy] = useState<BreakdownDimension>(() =>
    readGroupBy(widget.config?.filters ?? {})
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isMouse || loadingTrackedPages) return;

    const savedPage = readMousePage(widget.config);
    const pages = trackedPages;

    if (savedPage && pages.some((p) => p.page === savedPage)) {
      setMousePage((current) => (current === savedPage ? current : savedPage));
      return;
    }

    const fallback = pages[0]?.page ?? "";
    setMousePage((current) => {
      if (current && pages.some((p) => p.page === current)) return current;
      return current === fallback ? current : fallback;
    });
  }, [isMouse, loadingTrackedPages, trackedPages, widget.config]);

  function handleMousePeriodChange(next: MousePeriod) {
    setMousePeriod(next);
    onMousePeriodChange?.(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setError(null);

    let config: WidgetConfig;

    if (isMouse) {
      config = buildMouseConfig(
        widget.config,
        mousePeriod,
        mousePage === "" ? null : mousePage
      );
    } else if (isEvents) {
      if (eventTagId === "") return;
      config = buildEventsConfig(
        widget.config,
        period,
        step,
        metric,
        eventTagId,
        eventVisualization,
        eventSeries
      );
    } else if (isFunnel) {
      if (tunnelId === "") return;
      config = buildFunnelConfig(widget.config, period, tunnelId);
    } else if (isBreakdown) {
      config = buildWidgetConfig(
        widget.config,
        period,
        step,
        metric,
        "",
        null,
        groupBy
      );
    } else if (isScrollDepth) {
      config = buildWidgetConfig(
        widget.config,
        period,
        step,
        "count",
        "",
        null,
        null
      );
    } else {
      config = buildWidgetConfig(
        widget.config,
        period,
        step,
        metric,
        eventType,
        tagId === "" ? null : tagId
      );
    }

    startTransition(async () => {
      const updated = await updateWidget(widget.id, {
        title: trimmedTitle,
        config,
      });
      if (!updated) {
        setError(t("updateError"));
        return;
      }
      onSaved();
    });
  }

  const funnelSaveDisabled = isFunnel && tunnelId === "";
  const eventsSaveDisabled = isEvents && eventTagId === "";
  const titleSaveDisabled = !title.trim();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground-muted">
          {t("widgetTitle")}
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={fieldClass}
          required
        />
      </label>

      {isMouse ? (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground-muted">
              {t("mousePeriodLabel")}
            </span>
            <select
              value={mousePeriod}
              onChange={(e) =>
                handleMousePeriodChange(e.target.value as MousePeriod)
              }
              className={fieldClass}
            >
              {MOUSE_PERIODS.map((preset) => (
                <option key={preset} value={preset}>
                  {t(`mousePeriod_${preset}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground-muted">
              {t("mousePageLabel")}
            </span>
            <select
              value={mousePage}
              onChange={(e) => setMousePage(e.target.value)}
              disabled={loadingTrackedPages || trackedPages.length === 0}
              className={fieldClass}
            >
              {loadingTrackedPages && <option value="">—</option>}
              {!loadingTrackedPages && trackedPages.length === 0 && (
                <option value="">—</option>
              )}
              {trackedPages.map((page) => (
                <option key={page.page} value={page.page}>
                  {pageLabel(page.page)} ({page.count})
                </option>
              ))}
            </select>
          </label>
        </>
      ) : isEvents ? (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground-muted">
              {t("filterTagLabel")}
            </span>
            <select
              value={eventTagId}
              onChange={(e) =>
                setEventTagId(e.target.value === "" ? "" : Number(e.target.value))
              }
              className={fieldClass}
              required
            >
              <option value="">{t("eventsSelectTag")}</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.comment ? `${tag.slug} — ${tag.comment}` : tag.slug}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground-muted">
              {t("eventsVisualizationLabel")}
            </span>
            <select
              value={eventVisualization}
              onChange={(e) =>
                setEventVisualization(e.target.value as EventVisualization)
              }
              className={fieldClass}
            >
              {EVENT_VISUALIZATIONS.map((visualization) => (
                <option key={visualization} value={visualization}>
                  {t(`eventsVisualization_${visualization}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground-muted">
              {t("periodLabel")}
            </span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodPreset)}
              className={fieldClass}
            >
              {PERIOD_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {t(`period_${preset}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span
              className={`text-sm font-medium ${
                eventVisualization === "nombre"
                  ? "text-foreground-muted/50"
                  : "text-foreground-muted"
              }`}
            >
              {t("stepLabel")}
            </span>
            <select
              value={step}
              onChange={(e) => setStep(e.target.value as TimeStep)}
              disabled={eventVisualization === "nombre"}
              className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {TIME_STEPS.map((timeStep) => (
                <option key={timeStep} value={timeStep}>
                  {t(`step_${timeStep}`)}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-foreground-muted">
              {t("metricLabel")}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_METRICS.map((value) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-colors ${
                    metric === value
                      ? "border-primary bg-primary-muted text-primary"
                      : "border-border-subtle hover:border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="eventMetric"
                    value={value}
                    checked={metric === value}
                    onChange={() => setMetric(value)}
                    className="sr-only"
                  />
                  {t(`metric_${value}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-foreground-muted">
              {t("seriesLabel")}
            </legend>
            <SeriesEditor
              series={eventSeries}
              onChange={setEventSeries}
              minSeries={1}
            />
          </fieldset>
        </>
      ) : (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground-muted">
              {t("periodLabel")}
            </span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodPreset)}
              className={fieldClass}
            >
              {PERIOD_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {t(`period_${preset}`)}
                </option>
              ))}
            </select>
          </label>

          {isFunnel ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground-muted">
                {t("tunnelLabel")}
              </span>
              <select
                value={tunnelId}
                onChange={(e) =>
                  setTunnelId(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className={fieldClass}
              >
                <option value="">—</option>
                {tunnels.map((tunnel) => (
                  <option key={tunnel.id} value={tunnel.id}>
                    {tunnel.name}
                  </option>
                ))}
              </select>
            </label>
          ) : isScrollDepth ? null : (
            <>
              {isBreakdown && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    {t("breakdownGroupByLabel")}
                  </span>
                  <select
                    value={groupBy}
                    onChange={(e) =>
                      setGroupBy(e.target.value as BreakdownDimension)
                    }
                    className={fieldClass}
                  >
                    {BREAKDOWN_DIMENSIONS.map((dimension) => (
                      <option key={dimension} value={dimension}>
                        {t(`groupBy_${dimension}`)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {!isScrollDepth && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground-muted">
                    {t("stepLabel")}
                  </span>
                  <select
                    value={step}
                    onChange={(e) => setStep(e.target.value as TimeStep)}
                    className={fieldClass}
                  >
                    {TIME_STEPS.map((timeStep) => (
                      <option key={timeStep} value={timeStep}>
                        {t(`step_${timeStep}`)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {!isScrollDepth && (
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium text-foreground-muted">
                    {t("metricLabel")}
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(["count", "rate"] as WidgetMetric[]).map((value) => (
                      <label
                        key={value}
                        className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-colors ${
                          metric === value
                            ? "border-primary bg-primary-muted text-primary"
                            : "border-border-subtle hover:border-border"
                        }`}
                      >
                        <input
                          type="radio"
                          name="metric"
                          value={value}
                          checked={metric === value}
                          onChange={() => setMetric(value)}
                          className="sr-only"
                        />
                        {t(`metric_${value}`)}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {!isBreakdown && !isScrollDepth && (
                <>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground-muted">
                      {t("filterTypeLabel")}
                    </span>
                    <input
                      type="text"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      placeholder={t("filterTypePlaceholder")}
                      className={fieldClass}
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground-muted">
                      {t("filterTagLabel")}
                    </span>
                    <select
                      value={tagId}
                      onChange={(e) =>
                        setTagId(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className={fieldClass}
                    >
                      <option value="">{t("filterTagAll")}</option>
                      {tags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.comment
                            ? `${tag.slug} — ${tag.comment}`
                            : tag.slug}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </>
          )}
        </>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="sticky bottom-0 -mx-6 mt-auto flex justify-end gap-2 border-t border-border-subtle bg-surface-1 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={
            isPending ||
            funnelSaveDisabled ||
            eventsSaveDisabled ||
            titleSaveDisabled
          }
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
