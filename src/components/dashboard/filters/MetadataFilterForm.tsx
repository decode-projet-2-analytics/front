"use client";

import { useTranslations } from "next-intl";
import type { FilterOp, MetadataFilter } from "@/lib/metadataFilters";

const FILTER_OPS: FilterOp[] = ["eq", "neq", "gt", "gte", "lt", "lte", "exists"];

const fieldClass =
  "rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm outline-none focus:border-white focus:outline-none focus:ring-0";

interface Props {
  filters: MetadataFilter[];
  onChange: (filters: MetadataFilter[]) => void;
}

function normalizeFilter(filter: MetadataFilter): MetadataFilter {
  if (filter.op === "exists") {
    return { key: filter.key, op: filter.op };
  }

  return filter;
}

export default function MetadataFilterForm({ filters, onChange }: Props) {
  const t = useTranslations("Dashboard");

  function updateFilter(index: number, patch: Partial<MetadataFilter>) {
    onChange(
      filters.map((filter, currentIndex) =>
        currentIndex === index ? normalizeFilter({ ...filter, ...patch }) : filter
      )
    );
  }

  function addFilter() {
    onChange([...filters, { key: "", op: "eq", value: "" }]);
  }

  function removeFilter(index: number) {
    onChange(filters.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {filters.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-subtle bg-surface-0 px-3 py-2 text-sm text-foreground-muted">
          {t("metadataFiltersEmpty")}
        </p>
      ) : (
        filters.map((filter, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-lg border border-border-subtle bg-surface-1 p-3 sm:grid-cols-[1fr_auto_1fr_auto]"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground-muted">
                {t("metadataFilterKey")}
              </span>
              <input
                type="text"
                value={filter.key}
                onChange={(e) => updateFilter(index, { key: e.target.value })}
                placeholder={t("metadataFilterKeyPlaceholder")}
                className={fieldClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground-muted">
                {t("metadataFilterOp")}
              </span>
              <select
                value={filter.op}
                onChange={(e) =>
                  updateFilter(index, { op: e.target.value as FilterOp })
                }
                className={fieldClass}
              >
                {FILTER_OPS.map((op) => (
                  <option key={op} value={op}>
                    {t(`metadataFilterOp_${op}`)}
                  </option>
                ))}
              </select>
            </label>

            {filter.op !== "exists" ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground-muted">
                  {t("metadataFilterValue")}
                </span>
                <input
                  type="text"
                  value={String(filter.value ?? "")}
                  onChange={(e) => updateFilter(index, { value: e.target.value })}
                  placeholder={t("metadataFilterValuePlaceholder")}
                  className={fieldClass}
                />
              </label>
            ) : (
              <div className="hidden sm:block" />
            )}

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => removeFilter(index)}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2"
              >
                {t("remove")}
              </button>
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={addFilter}
        className="self-start rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2"
      >
        {t("addMetadataFilter")}
      </button>
    </div>
  );
}
