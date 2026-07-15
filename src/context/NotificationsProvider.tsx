"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "@/i18n/navigation";
import {
  getCallNotificationPresentation,
  getMessageNotificationPresentation,
  shouldShowAdminSupportNotifications,
  type AdminCallNotification,
  type AdminMessageNotification,
  type AdminNotificationPresentation,
} from "@/lib/adminNotificationPresentation.mjs";

const NOTIFICATIONS_NAMESPACE = "/notifications";

const EVENTS = {
  AVAILABILITY_ADMIN: "availability:admin",
  AVAILABILITY_USER: "availability:user",
  AVAILABILITY_USERS: "availability:users",
  ADMIN_MESSAGE: "notification:message",
  ADMIN_CALL: "notification:call",
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
  const router = useRouter();
  const t = useTranslations("Support.notifications");
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

    function showAdminNotification(
      presentation: AdminNotificationPresentation,
    ) {
      toast(presentation.title, {
        id: presentation.id,
        description: presentation.description,
        action: {
          label: presentation.actionLabel,
          onClick: () => router.push(presentation.href),
        },
      });
    }

    function onAdminMessage(payload: AdminMessageNotification) {
      showAdminNotification(getMessageNotificationPresentation(payload, t));
    }

    function onAdminCall(payload: AdminCallNotification) {
      showAdminNotification(getCallNotificationPresentation(payload, t));
    }

    const showAdminNotifications =
      shouldShowAdminSupportNotifications(userRole);

    if (!showAdminNotifications) {
      socket.on(EVENTS.AVAILABILITY_ADMIN, onAdminAvailability);
    } else {
      socket.on(EVENTS.AVAILABILITY_USERS, onUsersSnapshot);
      socket.on(EVENTS.AVAILABILITY_USER, onUserAvailability);
      socket.on(EVENTS.ADMIN_MESSAGE, onAdminMessage);
      socket.on(EVENTS.ADMIN_CALL, onAdminCall);
    }

    return () => {
      if (!showAdminNotifications) {
        socket.off(EVENTS.AVAILABILITY_ADMIN, onAdminAvailability);
      } else {
        socket.off(EVENTS.AVAILABILITY_USERS, onUsersSnapshot);
        socket.off(EVENTS.AVAILABILITY_USER, onUserAvailability);
        socket.off(EVENTS.ADMIN_MESSAGE, onAdminMessage);
        socket.off(EVENTS.ADMIN_CALL, onAdminCall);
      }
    };
  }, [router, socket, t, userRole]);

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
