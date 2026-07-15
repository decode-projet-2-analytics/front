export interface AdminMessageNotification {
  notificationId: string;
  conversationId: string;
  senderId: number;
  senderFirstname: string | null;
  preview: string;
}

export interface AdminCallNotification {
  notificationId: string;
  conversationId: string;
  callId: string;
  callerId: number;
  callerFirstname: string | null;
  media: { audio: boolean; video: boolean };
}

export interface AdminNotificationPresentation {
  id: string;
  title: string;
  description: string;
  href: `/help/chat/${string}`;
  actionLabel: string;
}

type Translate = (
  key: string,
  values?: Record<string, string>,
) => string;

export function shouldShowAdminSupportNotifications(
  userRole: "Admin" | "Webmaster",
): boolean;

export function getMessageNotificationPresentation(
  payload: AdminMessageNotification,
  translate: Translate,
): AdminNotificationPresentation;

export function getCallNotificationPresentation(
  payload: AdminCallNotification,
  translate: Translate,
): AdminNotificationPresentation;
