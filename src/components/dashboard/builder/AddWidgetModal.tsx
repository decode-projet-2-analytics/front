"use client";



import { useEffect, useState, useTransition } from "react";

import { useTranslations } from "next-intl";

import { createWidget, type Widget, type WidgetType } from "@/lib/dashboardApi";



const WIDGET_TYPES: WidgetType[] = [

  "events",

  "funnel",

  "mouse_heatmap",

  "breakdown",

  "scroll_depth",

];



interface Props {

  open: boolean;

  applicationId: number;

  onClose: () => void;

  onCreated: (widget: Widget) => void;

}



export default function AddWidgetModal({

  open,

  applicationId,

  onClose,

  onCreated,

}: Props) {

  const t = useTranslations("Dashboard");

  const [type, setType] = useState<WidgetType>("events");

  const [title, setTitle] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();



  useEffect(() => {

    if (open) {

      setType("events");

      setTitle("");

      setError(null);

    }

  }, [open]);



  if (!open) return null;



  function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    setError(null);



    const trimmedTitle = title.trim();

    if (!trimmedTitle) return;



    startTransition(async () => {

      const baseConfig = {

        filters: {},

        timeRange: { from: null, to: null, step: "1h" as const },

        metric: "count" as const,

      };



      const config =

        type === "events"

          ? {

              ...baseConfig,

              tagId: undefined,

              visualization: "nombre" as const,

              series: [{ name: "All", filters: [] }],

              layout: { x: 0, y: 0, w: 4, h: 4 },

            }

          : type === "funnel"

            ? {

                ...baseConfig,

                tunnelId: undefined,

                layout: { x: 0, y: 0, w: 12, h: 5 },

              }

            : type === "mouse_heatmap"

              ? {

                  ...baseConfig,

                  mouse: { period: "7d" as const, page: null },

                  layout: { x: 0, y: 0, w: 12, h: 6 },

                }

              : type === "breakdown"

                ? {

                    ...baseConfig,

                    filters: { groupBy: "url" },

                    layout: { x: 0, y: 0, w: 6, h: 5 },

                  }

                : type === "scroll_depth"

                  ? {

                      ...baseConfig,

                      layout: { x: 0, y: 0, w: 6, h: 5 },

                    }

                  : baseConfig;



      const widget = await createWidget({

        type,

        title: trimmedTitle,

        applicationId,

        config,

      });



      if (!widget) {

        setError(t("createError"));

        return;

      }



      onCreated(widget);

      onClose();

    });

  }



  return (

    <div

      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"

      onClick={onClose}

      role="presentation"

    >

      <div

        className="w-full max-w-md rounded-xl border border-border bg-surface-1 p-6 shadow-lg"

        onClick={(e) => e.stopPropagation()}

        role="dialog"

        aria-modal="true"

        aria-labelledby="add-widget-title"

      >

        <h2 id="add-widget-title" className="text-lg font-semibold">

          {t("modalTitle")}

        </h2>



        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">

          <fieldset className="flex flex-col gap-2">

            <legend className="text-sm font-medium text-foreground-muted">

              {t("widgetType")}

            </legend>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

              {WIDGET_TYPES.map((widgetType) => (

                <label

                  key={widgetType}

                  className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-colors ${

                    type === widgetType

                      ? "border-primary bg-primary-muted text-primary"

                      : "border-border-subtle hover:border-border"

                  }`}

                >

                  <input

                    type="radio"

                    name="widgetType"

                    value={widgetType}

                    checked={type === widgetType}

                    onChange={() => setType(widgetType)}

                    className="sr-only"

                  />

                  {t(`type_${widgetType}`)}

                </label>

              ))}

            </div>

          </fieldset>



          <label className="flex flex-col gap-1.5">

            <span className="text-sm font-medium text-foreground-muted">

              {t("widgetTitle")}

            </span>

            <input

              type="text"

              value={title}

              onChange={(e) => setTitle(e.target.value)}

              placeholder={t("widgetTitlePlaceholder")}

              className="rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm outline-none focus:border-white focus:outline-none focus:ring-0"

              required

            />

          </label>



          {error && <p className="text-sm text-error">{error}</p>}



          <div className="flex justify-end gap-2 pt-2">

            <button

              type="button"

              onClick={onClose}

              disabled={isPending}

              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"

            >

              {t("cancel")}

            </button>

            <button

              type="submit"

              disabled={isPending || !title.trim()}

              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"

            >

              {isPending ? t("creating") : t("create")}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}

