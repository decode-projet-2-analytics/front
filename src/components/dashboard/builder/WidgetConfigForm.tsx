"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  updateWidget,
  type Tag,
  type Widget,
  type WidgetConfig,
  type WidgetMetric,
} from "@/lib/dashboardApi";
import {
  PERIOD_PRESETS,
  TIME_STEPS,
  buildWidgetConfig,
  inferPeriod,
  readEventType,
  readTagId,
  type PeriodPreset,
  type TimeStep,
} from "./widgetConfigUtils";

const fieldClass =
  "rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm outline-none focus:border-white focus:outline-none focus:ring-0";

interface Props {
  widget: Widget;
  tags: Tag[];
  onSaved: () => void;
  onCancel: () => void;
}

export default function WidgetConfigForm({
  widget,
  tags,
  onSaved,
  onCancel,
}: Props) {
  const t = useTranslations("Dashboard");
  const [period, setPeriod] = useState<PeriodPreset>(() =>
    inferPeriod(widget.config.timeRange)
  );
  const [step, setStep] = useState<TimeStep>(
    (widget.config.timeRange.step as TimeStep) || "1h"
  );
  const [metric, setMetric] = useState<WidgetMetric>(widget.config.metric);
  const [eventType, setEventType] = useState(() =>
    readEventType(widget.config.filters)
  );
  const [tagId, setTagId] = useState<number | "">(
    readTagId(widget.config.filters) ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPeriod(inferPeriod(widget.config.timeRange));
    setStep((widget.config.timeRange.step as TimeStep) || "1h");
    setMetric(widget.config.metric);
    setEventType(readEventType(widget.config.filters));
    setTagId(readTagId(widget.config.filters) ?? "");
  }, [widget]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const config: WidgetConfig = buildWidgetConfig(
      widget.config,
      period,
      step,
      metric,
      eventType,
      tagId === "" ? null : tagId
    );

    startTransition(async () => {
      const updated = await updateWidget(widget.id, { config });
      if (!updated) {
        setError(t("updateError"));
        return;
      }
      onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            setTagId(e.target.value === "" ? "" : Number(e.target.value))
          }
          className={fieldClass}
        >
          <option value="">{t("filterTagAll")}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.comment || `#${tag.id}`}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
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
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
