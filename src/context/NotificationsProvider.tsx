"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSocket } from "@/hooks/useSocket";

const NOTIFICATIONS_NAMESPACE = "/notifications";

const EVENTS = {
  AVAILABILITY_ADMIN: "availability:admin",
  AVAILABILITY_USER: "availability:user",
  AVAILABILITY_USERS: "availability:users",
} as const;

interface NotificationsContextValue {
  userRole: "Admin" | "Webmaster";
  adminAvailable: boolean;
  onlineUserIds: Set<number>;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  userRole: "Webmaster",
  adminAvailable: false,
  onlineUserIds: new Set(),
});

interface Props {
  userRole: "Admin" | "Webmaster";
  children: ReactNode;
}

export function NotificationsProvider({ userRole, children }: Props) {
  const { socket } = useSocket(NOTIFICATIONS_NAMESPACE);
  const [adminAvailable, setAdminAvailable] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!socket) return;

    function onAdminAvailability({ available }: { available: boolean }) {
      setAdminAvailable(available);
    }

    function onUsersSnapshot({ userIds }: { userIds: number[] }) {
      setOnlineUserIds(new Set(userIds));
    }

    function onUserAvailability({
      userId,
      available,
    }: {
      userId: number;
      available: boolean;
    }) {
      setOnlineUserIds((current) => {
        const next = new Set(current);

        if (available) {
          next.add(userId);
        } else {
          next.delete(userId);
        }

        return next;
      });
    }

    if (userRole === "Webmaster") {
      socket.on(EVENTS.AVAILABILITY_ADMIN, onAdminAvailability);
    } else {
      socket.on(EVENTS.AVAILABILITY_USERS, onUsersSnapshot);
      socket.on(EVENTS.AVAILABILITY_USER, onUserAvailability);
    }

    return () => {
      if (userRole === "Webmaster") {
        socket.off(EVENTS.AVAILABILITY_ADMIN, onAdminAvailability);
      } else {
        socket.off(EVENTS.AVAILABILITY_USERS, onUsersSnapshot);
        socket.off(EVENTS.AVAILABILITY_USER, onUserAvailability);
      }
    };
  }, [socket, userRole]);

  const value = useMemo(
    () => ({ userRole, adminAvailable, onlineUserIds }),
    [userRole, adminAvailable, onlineUserIds],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  return useContext(NotificationsContext);
}
