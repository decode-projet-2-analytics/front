"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

export type WidgetLivePayload = {
  applicationId: number;
  widgetId: number;
  type: string;
  updatedAt: string;
  data: unknown;
};

export function useAnalyticsSocket(applicationId: number | null) {
  const { socket, connectionState } = useSocket("/analytics");
  const [dataByWidgetId, setDataByWidgetId] = useState<Record<number, unknown>>({});
  const [lastPushAt, setLastPushAt] = useState(0);

  useEffect(() => {
    if (!socket || applicationId == null) return;

    setDataByWidgetId({});
    socket.emit("subscribe", { applicationId });

    function onData(payload: WidgetLivePayload) {
      if (payload.applicationId !== applicationId) return;
      setDataByWidgetId((prev) => ({
        ...prev,
        [payload.widgetId]: payload.data,
      }));
      setLastPushAt(Date.now());
    }

    socket.on("widget:data", onData);

    return () => {
      socket.off("widget:data", onData);
      socket.emit("unsubscribe", { applicationId });
    };
  }, [socket, applicationId]);

  return { connectionState, dataByWidgetId, lastPushAt, socket };
}
