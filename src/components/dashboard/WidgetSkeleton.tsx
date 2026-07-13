import type { WidgetType } from "@/lib/dashboardApi";

interface ContentProps {
  type: WidgetType;
}

interface CardProps {
  count?: number;
}

function contentHeight(type: WidgetType): string {
  if (type === "events") return "h-40";
  if (type === "funnel") return "h-48";
  return "h-48";
}

export function WidgetContentSkeleton({ type }: ContentProps) {
  const height = contentHeight(type);

  return (
    <div
      className={`${height} animate-pulse rounded-lg border border-border-subtle bg-surface-0 p-4`}
    >
      {type === "events" ? (
        <div className="flex h-full flex-col gap-3">
          <div className="h-3 w-1/3 rounded-md bg-surface-2" />
          <div className="flex min-h-0 flex-1 items-end gap-1">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="flex-1 rounded-sm bg-surface-2"
                style={{ height: `${30 + (index % 5) * 12}%` }}
              />
            ))}
          </div>
        </div>
      ) : type === "funnel" ? (
        <div className="flex h-full flex-col justify-center gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <div className="h-2 w-1/4 rounded-md bg-surface-2" />
              <div
                className="h-2 rounded-full bg-surface-2"
                style={{ width: `${90 - index * 18}%` }}
              />
            </div>
          ))}
        </div>
      ) : type === "breakdown" || type === "scroll_depth" ? (
        <div className="flex h-full flex-col justify-center gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <div className="h-2 w-1/3 rounded-md bg-surface-2" />
              <div
                className="h-2 rounded-full bg-surface-2"
                style={{ width: `${90 - index * 15}%` }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid h-full grid-rows-7 gap-1">
          {Array.from({ length: 7 }).map((_, row) => (
            <div key={row} className="grid grid-cols-12 gap-1">
              {Array.from({ length: 12 }).map((__, col) => (
                <div key={col} className="rounded-sm bg-surface-2" />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WidgetCardSkeleton({ count = 3 }: CardProps) {
  const types: WidgetType[] = ["events", "funnel", "mouse_heatmap"];

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="flex animate-pulse flex-col rounded-lg border border-border-subtle bg-surface-1 p-4"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded-md bg-surface-2" />
              <div className="h-5 w-16 rounded-full bg-surface-2" />
            </div>
            <div className="h-8 w-8 rounded-lg bg-surface-2" />
          </div>
          <WidgetContentSkeleton type={types[index % types.length]} />
        </article>
      ))}
    </>
  );
}
