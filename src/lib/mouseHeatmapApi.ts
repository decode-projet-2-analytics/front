"use server";

import { apiFetch } from "./api";

/** Period presets supported by the mouse-heatmap endpoints. */
export type HeatmapPeriod = "today" | "7d" | "30d";

/** A page that has mouse-tracking data, with its total number of points. */
export interface TrackedPage {
  page: string;
  count: number;
}

/** A single recorded mouse position (document coordinates). */
export interface MousePoint {
  x: number;
  y: number;
}

/** The document coordinate space the points live in. */
export interface DocSize {
  width: number;
  height: number;
}

/** Mouse movements for one page over a period. */
export interface MouseMovements {
  page: string;
  period: HeatmapPeriod;
  count: number;
  truncated: boolean;
  /** Coordinate space of the points; null for legacy events. */
  docSize: DocSize | null;
  points: MousePoint[];
}

/** An automatic screenshot of a page, used as the heatmap background. */
export interface PageSnapshotData {
  image: string;
  width: number;
  height: number;
  capturedAt: string;
}

/**
 * List the pages that have mouse-tracking data for an application/period.
 * Returns [] on any error (same convention as the other dashboard clients).
 */
export async function fetchTrackedPages(
  applicationId: number,
  period: HeatmapPeriod
): Promise<TrackedPage[]> {
  const params = new URLSearchParams({
    applicationId: String(applicationId),
    period,
  });
  const res = await apiFetch(`/analytics/mouse/pages?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

/**
 * Fetch every mouse point recorded for a given page over a period.
 * Returns null on any error.
 */
export async function fetchMouseMovements(
  applicationId: number,
  page: string,
  period: HeatmapPeriod
): Promise<MouseMovements | null> {
  const params = new URLSearchParams({
    applicationId: String(applicationId),
    page,
    period,
  });
  const res = await apiFetch(
    `/analytics/mouse/movements?${params.toString()}`,
    { cache: "no-store" },
  );

  if (!res.ok) return null;
  return res.json();
}

/**
 * Fetch the latest page screenshot for a page (used as the heatmap
 * background). Returns null when there is no snapshot (HTTP 204) or on error.
 */
export async function fetchPageSnapshot(
  applicationId: number,
  page: string
): Promise<PageSnapshotData | null> {
  const params = new URLSearchParams({
    applicationId: String(applicationId),
    page,
  });
  const res = await apiFetch(
    `/analytics/mouse/snapshot?${params.toString()}`,
    { cache: "no-store" },
  );

  if (res.status === 204 || !res.ok) return null;
  return res.json();
}
