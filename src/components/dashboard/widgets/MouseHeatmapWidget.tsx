"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateWidget, type Widget } from "@/lib/dashboardApi";
import {
  fetchMouseMovements,
  fetchPageSnapshot,
  fetchTrackedPages,
  type DocSize,
  type HeatmapPeriod,
  type MouseMovements,
  type MousePoint,
  type PageSnapshotData,
  type TrackedPage,
} from "@/lib/mouseHeatmapApi";
import {
  buildMouseConfig,
  readMousePage,
  readMousePeriod,
  type MousePeriod,
} from "../builder/widgetConfigUtils";

const PERIODS: HeatmapPeriod[] = ["today", "7d", "30d"];

// Reference canvas size used only when the SDK did not report the document
// size (legacy events): we fall back to bounds derived from the points.
const FALLBACK_WIDTH = 1280;
const FALLBACK_HEIGHT = 720;

// Group nearby points into buckets: fewer draw calls + a meaningful `max` so
// busy zones actually stand out instead of everything saturating.
const BUCKET_SIZE = 12; // pixels, in source (logical) space

// Max opacity (0-255) of the heat layer over the page screenshot.
const MAX_ALPHA = 180;

/** Live push payload for a `mouse_heatmap` widget (see backend push.js). */
export interface MouseHeatmapLiveData {
  period: HeatmapPeriod;
  page: string | null;
  pages?: TrackedPage[];
  movements?: MouseMovements | null;
  snapshot?: PageSnapshotData | null;
}

interface Props {
  widget: Widget;
  liveData?: MouseHeatmapLiveData | null;
  onConfigPatched?: () => void;
}

interface Bucketed {
  points: { x: number; y: number; value: number }[];
  max: number;
  width: number;
  height: number;
}

/**
 * Aggregate raw points into a coarse grid. The reference size is the document
 * coordinate space (`docSize`) when the SDK reported it, so points align with
 * the page screenshot; otherwise we fall back to bounds derived from the data.
 */
function bucketPoints(raw: MousePoint[], ref: DocSize | null): Bucketed {
  let maxX = 0;
  let maxY = 0;
  const cells = new Map<string, { x: number; y: number; value: number }>();

  for (const point of raw) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);

    const cx = Math.floor(point.x / BUCKET_SIZE) * BUCKET_SIZE + BUCKET_SIZE / 2;
    const cy = Math.floor(point.y / BUCKET_SIZE) * BUCKET_SIZE + BUCKET_SIZE / 2;
    const key = `${cx}:${cy}`;
    const cell = cells.get(key);
    if (cell) cell.value += 1;
    else cells.set(key, { x: cx, y: cy, value: 1 });
  }

  const points = [...cells.values()];
  const max = points.reduce((acc, cell) => Math.max(acc, cell.value), 0);

  const width =
    ref && ref.width > 0 ? ref.width : Math.max(FALLBACK_WIDTH, Math.ceil(maxX));
  const height =
    ref && ref.height > 0 ? ref.height : Math.max(FALLBACK_HEIGHT, Math.ceil(maxY));

  return { points, max: Math.max(max, 1), width, height };
}

/** Shorten a full URL to its path for display in the selector. */
function pageLabel(page: string): string {
  try {
    const url = new URL(page);
    return url.pathname + url.search;
  } catch {
    return page;
  }
}

// 256-color gradient (blue → cyan → green → yellow → red), indexed by intensity.
// Built lazily on the client (needs the DOM) and cached.
let paletteCache: Uint8ClampedArray | null = null;
function getPalette(): Uint8ClampedArray {
  if (paletteCache) return paletteCache;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0.0, "rgba(0,0,255,1)");
  gradient.addColorStop(0.45, "rgba(0,255,255,1)");
  gradient.addColorStop(0.65, "rgba(0,255,0,1)");
  gradient.addColorStop(0.85, "rgba(255,255,0,1)");
  gradient.addColorStop(1.0, "rgba(255,0,0,1)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);
  paletteCache = ctx.getImageData(0, 0, 256, 1).data;
  return paletteCache;
}

/**
 * Draw a heatmap of the bucketed points onto `canvas`, sized to its rendered
 * (CSS) box. Classic two-pass technique: additive grayscale intensity, then
 * colorize each pixel by its accumulated alpha. Self-contained (no external
 * lib) so it renders reliably under the app bundler.
 */
function drawHeatmap(canvas: HTMLCanvasElement, bucket: Bucketed): void {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width === 0 || height === 0) return;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scaleX = width / bucket.width;
  const scaleY = height / bucket.height;
  const radius = Math.max(15, Math.round(width * 0.04));

  // Pass 1: accumulate intensity as grayscale alpha.
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";
  for (const cell of bucket.points) {
    const x = cell.x * scaleX;
    const y = cell.y * scaleY;
    const alpha = Math.min(1, 0.15 + 0.85 * (cell.value / bucket.max));
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  ctx.globalCompositeOperation = "source-over";

  // Pass 2: map alpha → color palette.
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const palette = getPalette();
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) continue;
    const offset = alpha * 4;
    data[i] = palette[offset];
    data[i + 1] = palette[offset + 1];
    data[i + 2] = palette[offset + 2];
    data[i + 3] = Math.min(MAX_ALPHA, alpha);
  }
  ctx.putImageData(image, 0, 0);
}

export default function MouseHeatmapWidget({
  widget,
  liveData = null,
  onConfigPatched,
}: Props) {
  const t = useTranslations("Dashboard");
  const applicationId = widget.applicationId;
  const [, startPatchTransition] = useTransition();

  const [period, setPeriod] = useState<HeatmapPeriod>(() =>
    readMousePeriod(widget.config)
  );
  const [pages, setPages] = useState<TrackedPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(() =>
    readMousePage(widget.config)
  );
  const [bucket, setBucket] = useState<Bucketed | null>(null);
  const [snapshot, setSnapshot] = useState<PageSnapshotData | null>(null);
  const [pointCount, setPointCount] = useState(0);
  const [truncated, setTruncated] = useState(false);

  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [error, setError] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setPeriod(readMousePeriod(widget.config));
    setSelectedPage(readMousePage(widget.config));
    setPatchError(null);
    }, [widget.config]);

  function patchConfig(nextPeriod: MousePeriod, nextPage: string | null) {
    startPatchTransition(async () => {
      setPatchError(null);
      const config = buildMouseConfig(widget.config, nextPeriod, nextPage);
      const updated = await updateWidget(widget.id, { config });
      if (updated) {
        onConfigPatched?.();
      } else {
        setPeriod(readMousePeriod(widget.config));
        setSelectedPage(readMousePage(widget.config));
        setPatchError(t("updateError"));
      }
    });
  }

  function handlePeriodChange(nextPeriod: HeatmapPeriod) {
    setPeriod(nextPeriod);
    patchConfig(nextPeriod, selectedPage);
  }

  function handlePageChange(nextPage: string | null) {
    setSelectedPage(nextPage);
    patchConfig(period, nextPage);
  }

  // 1) Load the list of tracked pages for the current app + period.
  useEffect(() => {
    let cancelled = false;
    setLoadingPages(true);
    setError(false);

    fetchTrackedPages(applicationId, period).then((result) => {
      if (cancelled) return;
      setPages(result);

      const persistedPage = readMousePage(widget.config);

      setSelectedPage((current) => {
        if (current && result.some((p) => p.page === current)) {
          return current;
        }
        if (persistedPage && result.some((p) => p.page === persistedPage)) {
          return persistedPage;
        }
        return result[0]?.page ?? null;
      });

      setLoadingPages(false);
    });

    return () => {
      cancelled = true;
    };
    // Intentionally omit widget.config: auto-select must not patch+refresh in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- persist only via user actions
  }, [applicationId, period]);

  // 2) Load the movements for the selected page and bucket them for drawing.
  useEffect(() => {
    if (!selectedPage) {
      setBucket(null);
      setPointCount(0);
      setSnapshot(null);
      return;
    }

    let cancelled = false;
    setLoadingPoints(true);
    setError(false);

    Promise.all([
      fetchMouseMovements(applicationId, selectedPage, period),
      fetchPageSnapshot(applicationId, selectedPage),
    ]).then(([movements, snap]) => {
      if (cancelled) return;

      if (!movements) {
        setError(true);
        setBucket(null);
        setPointCount(0);
        setTruncated(false);
      } else {
        setPointCount(movements.count);
        setTruncated(movements.truncated);
        setBucket(
          movements.points.length > 0
            ? bucketPoints(movements.points, movements.docSize)
            : null
        );
      }
      setSnapshot(snap);

      setLoadingPoints(false);
    });

    return () => {
      cancelled = true;
    };
  }, [applicationId, selectedPage, period]);

  // 2b) Apply a live socket push directly (no refetch) when it matches the
  // period/page currently shown; stale payloads (e.g. from before a config
  // patch was applied) are ignored.
  useEffect(() => {
    if (!liveData) return;
    if (liveData.period !== period || liveData.page !== selectedPage) return;

    if (Array.isArray(liveData.pages)) {
      setPages(liveData.pages);
    }

    if (liveData.movements) {
      setPointCount(liveData.movements.count);
      setTruncated(liveData.movements.truncated);
      setBucket(
        liveData.movements.points.length > 0
          ? bucketPoints(liveData.movements.points, liveData.movements.docSize)
          : null
      );
      setError(false);
    } else if (liveData.movements === null) {
      setBucket(null);
      setPointCount(0);
      setTruncated(false);
    }

    if (liveData.snapshot) {
      setSnapshot(liveData.snapshot);
    }

    setLoadingPages(false);
    setLoadingPoints(false);
  }, [liveData, period, selectedPage]);

  // 3) Draw (and re-draw on resize) the heatmap from the bucketed data.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bucket) return;

    const draw = () => drawHeatmap(canvas, bucket);
    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [bucket]);

  const showInitialSkeleton = loadingPages && pages.length === 0;

  return (
    <div
      className={`flex h-full min-h-0 w-full flex-col gap-3 rounded-lg border border-border-subtle bg-surface-1 p-3 transition-opacity ${
        loadingPoints ? "opacity-70" : ""
      }`}
    >
      {/* Controls: page selector + period toggle */}
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground-muted">
            {t("mouseHeatmapPageLabel")}
          </span>
          <select
            value={selectedPage ?? ""}
            onChange={(e) => handlePageChange(e.target.value || null)}
            disabled={pages.length === 0}
            className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm outline-none focus:border-white focus:outline-none focus:ring-0 disabled:opacity-50"
          >
            {pages.length === 0 && <option value="">—</option>}
            {pages.map((page) => (
              <option key={page.page} value={page.page}>
                {pageLabel(page.page)} ({page.count})
              </option>
            ))}
          </select>
        </label>

        <div
          className="flex shrink-0 gap-1 rounded-lg border border-border-subtle bg-surface-0 p-1"
          role="group"
          aria-label={t("mouseHeatmapPeriodLabel")}
        >
          {PERIODS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePeriodChange(preset)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                period === preset
                  ? "bg-primary text-white"
                  : "text-foreground-secondary hover:bg-surface-2"
              }`}
            >
              {t(`mouseHeatmapPeriod_${preset}`)}
            </button>
          ))}
        </div>
      </div>

      {patchError && <p className="text-xs text-error">{patchError}</p>}

      {/* Heatmap surface / states */}
      {showInitialSkeleton ? (
        <div className="h-64 w-full animate-pulse rounded-md bg-surface-0" />
      ) : error ? (
        <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border-subtle bg-surface-0 text-sm text-error">
          {t("mouseHeatmapError")}
        </div>
      ) : pages.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
          {t("mouseHeatmapNoPages")}
        </div>
      ) : !bucket ? (
        <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border-subtle bg-surface-0 text-sm text-foreground-muted">
          {loadingPoints ? t("mouseHeatmapLoading") : t("mouseHeatmapNoData")}
        </div>
      ) : (
        <div
          className="relative min-h-0 w-full flex-1 overflow-hidden rounded-md border border-border-subtle bg-surface-0"
          style={{
            aspectRatio: snapshot
              ? `${snapshot.width} / ${snapshot.height}`
              : `${bucket.width} / ${bucket.height}`,
          }}
        >
          {snapshot && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={snapshot.image}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            />
          )}
          {/* heat layer drawn on canvas, over the page screenshot */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        </div>
      )}

      {/* Caption */}
      <div className="flex shrink-0 flex-col gap-1">
        {truncated && (
          <p className="text-xs text-warning">{t("mouseTruncated")}</p>
        )}
        <div className="flex items-center justify-between text-[10px] text-foreground-muted">
          <span>{t("mouseHeatmapPoints", { count: pointCount })}</span>
          <span>{t("mouseHeatmapCaption")}</span>
        </div>
      </div>
    </div>
  );
}
