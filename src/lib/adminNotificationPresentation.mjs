function senderName(firstname, translate) {
  return firstname || translate("unknownSender");
}

export function shouldShowAdminSupportNotifications(userRole) {
  return userRole === "Admin";
}

function basePresentation(payload, title, description, translate) {
  return {
    id: payload.notificationId,
    title,
    description,
    href: `/help/chat/${payload.conversationId}`,
    actionLabel: translate("open"),
  };
}

export function getMessageNotificationPresentation(payload, translate) {
  return basePresentation(
    payload,
    translate("newMessage"),
    translate("messageDescription", {
      sender: senderName(payload.senderFirstname, translate),
      preview: payload.preview,
    }),
    translate,
  );
}

export function getCallNotificationPresentation(payload, translate) {
  const mediaKey = payload.media.audio && payload.media.video
    ? "audioVideo"
    : payload.media.video
      ? "video"
      : "audio";

  return basePresentation(
    payload,
    translate("incomingCall"),
    translate("callDescription", {
      sender: senderName(payload.callerFirstname, translate),
      media: translate(mediaKey),
    }),
    translate,
  );
}
