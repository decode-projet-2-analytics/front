import test from "node:test";
import assert from "node:assert/strict";

import {
  getMessageNotificationPresentation,
  getCallNotificationPresentation,
  shouldShowAdminSupportNotifications,
} from "../src/lib/adminNotificationPresentation.mjs";

function translate(key, values = {}) {
  const messages = {
    newMessage: "Nouveau message",
    incomingCall: "Appel entrant",
    unknownSender: "Utilisateur",
    messageDescription: `${values.sender}: ${values.preview}`,
    callDescription: `${values.sender} demande un appel ${values.media}`,
    audio: "audio",
    video: "vidéo",
    audioVideo: "audio et vidéo",
    open: "Ouvrir",
  };

  return messages[key];
}

test("shows support notifications only to global admins", () => {
  assert.equal(shouldShowAdminSupportNotifications("Admin"), true);
  assert.equal(shouldShowAdminSupportNotifications("Webmaster"), false);
});

test("maps a message notification to a clickable presentation", () => {
  assert.deepEqual(
    getMessageNotificationPresentation(
      {
        notificationId: "message:42",
        conversationId: "conversation-1",
        senderId: 8,
        senderFirstname: "Lina",
        preview: "Bonjour",
      },
      translate,
    ),
    {
      id: "message:42",
      title: "Nouveau message",
      description: "Lina: Bonjour",
      href: "/help/chat/conversation-1",
      actionLabel: "Ouvrir",
    },
  );
});

test("uses the translated fallback when the message sender has no firstname", () => {
  const presentation = getMessageNotificationPresentation(
    {
      notificationId: "message:43",
      conversationId: "conversation-2",
      senderId: 9,
      senderFirstname: null,
      preview: "Besoin d'aide",
    },
    translate,
  );

  assert.equal(presentation.description, "Utilisateur: Besoin d'aide");
});

for (const [media, expected] of [
  [{ audio: true, video: false }, "audio"],
  [{ audio: false, video: true }, "vidéo"],
  [{ audio: true, video: true }, "audio et vidéo"],
]) {
  test(`maps ${expected} call media`, () => {
    const presentation = getCallNotificationPresentation(
      {
        notificationId: "call:1",
        conversationId: "conversation-1",
        callId: "1",
        callerId: 8,
        callerFirstname: "Lina",
        media,
      },
      translate,
    );

    assert.deepEqual(presentation, {
      id: "call:1",
      title: "Appel entrant",
      description: `Lina demande un appel ${expected}`,
      href: "/help/chat/conversation-1",
      actionLabel: "Ouvrir",
    });
  });
}
