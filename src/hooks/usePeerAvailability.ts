"use client";

import { useNotificationsContext } from "@/context/NotificationsProvider";


export function usePeerAvailability(userId: number | null | undefined) {
  const { adminAvailable, onlineUserIds } = useNotificationsContext();

  if (userId != null) {
    return onlineUserIds.has(userId);
  }

  return adminAvailable;
}
