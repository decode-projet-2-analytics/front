"use client";

import { useEffect, useState } from "react";

const DEFAULT_INTERVAL_MS = 10_000;

export function useWidgetPolling(intervalMs = DEFAULT_INTERVAL_MS) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (intervalMs <= 0) return;

    const id = window.setInterval(() => {
      setTick((value) => value + 1);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs]);

  return tick;
}
