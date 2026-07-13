"use client";

import { useTranslations } from "next-intl";
import type { MetadataFilter, WidgetSeries } from "@/lib/metadataFilters";
import MetadataFilterForm from "./MetadataFilterForm";

const fieldClass =
  "rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm outline-none focus:border-white focus:outline-none focus:ring-0";

interface Props {
  series: WidgetSeries[];
  onChange: (series: WidgetSeries[]) => void;
  minSeries?: number;
}

export default function SeriesEditor({ series, onChange, minSeries = 1 }: Props) {
  const t = useTranslations("Dashboard");

  function updateSeries(index: number, patch: Partial<WidgetSeries>) {
    onChange(
      series.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item
      )
    );
  }

  function updateFilters(index: number, filters: MetadataFilter[]) {
    updateSeries(index, { filters });
  }

  function addSeries() {
    onChange([
      ...series,
      { name: t("seriesDefaultName", { index: series.length + 1 }), filters: [] },
    ]);
  }

  function removeSeries(index: number) {
    if (series.length <= minSeries) return;
    onChange(series.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {series.map((item, index) => (
        <section
          key={index}
          className="rounded-xl border border-border-subtle bg-surface-0 p-3"
        >
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground-muted">
                {t("seriesNameLabel")}
              </span>
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateSeries(index, { name: e.target.value })}
                placeholder={t("seriesNamePlaceholder")}
                className={fieldClass}
              />
            </label>

            <button
              type="button"
              onClick={() => removeSeries(index)}
              disabled={series.length <= minSeries}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("removeSeries")}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-muted">
              {t("metadataFiltersLabel")}
            </p>
            <MetadataFilterForm
              filters={item.filters}
              onChange={(filters) => updateFilters(index, filters)}
            />
          </div>
        </section>
      ))}

      <button
        type="button"
        onClick={addSeries}
        className="self-start rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2"
      >
        {t("addSeries")}
      </button>
    </div>
  );
}
