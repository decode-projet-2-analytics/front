"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { CallState } from "@/hooks/useSupportCall";

interface Props {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callError: string | null;
  incomingCallerName: string | null;
  canStartCall: boolean;
  peerAvailable: boolean;
  isClosed: boolean;
  connectionReady: boolean;
  onStartCall: () => void;
  onAcceptCall: () => void;
  onRejectCall: () => void;
  onCancelCall: () => void;
  onEndCall: () => void;
}

function VideoTile({
  stream,
  muted,
  label,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-md bg-black/80">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className="h-full w-full object-cover"
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
          {label}
        </div>
      )}
    </div>
  );
}

export default function SupportCallPanel({
  callState,
  localStream,
  remoteStream,
  callError,
  incomingCallerName,
  canStartCall,
  peerAvailable,
  isClosed,
  connectionReady,
  onStartCall,
  onAcceptCall,
  onRejectCall,
  onCancelCall,
  onEndCall,
}: Props) {
  const t = useTranslations("Support.chat.call");

  const showMedia =
    callState === "connecting" ||
    callState === "in-call" ||
    localStream !== null ||
    remoteStream !== null;

  return (
    <div className="space-y-3 border-b border-border px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{t(`state.${callState}`)}</p>

        {callState === "idle" && canStartCall && (
          <button
            type="button"
            onClick={onStartCall}
            disabled={!connectionReady || !peerAvailable || isClosed}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {t("startCall")}
          </button>
        )}

        {callState === "outgoing" && (
          <button
            type="button"
            onClick={onCancelCall}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground"
          >
            {t("cancel")}
          </button>
        )}

        {(callState === "connecting" || callState === "in-call") && (
          <button
            type="button"
            onClick={onEndCall}
            className="rounded-md bg-error px-3 py-1.5 text-xs font-medium text-white"
          >
            {t("hangUp")}
          </button>
        )}
      </div>

      {callError && (
        <p className="text-xs text-error">{t(`errors.${callError}`)}</p>
      )}

      {callState === "incoming" && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-3">
          <p className="flex-1 text-sm text-foreground">
            {t("incomingFrom", {
              name: incomingCallerName ?? t("unknownCaller"),
            })}
          </p>
          <button
            type="button"
            onClick={onAcceptCall}
            className="rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white"
          >
            {t("accept")}
          </button>
          <button
            type="button"
            onClick={onRejectCall}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground"
          >
            {t("reject")}
          </button>
        </div>
      )}

      {showMedia && (
        <div className="grid gap-2 sm:grid-cols-2">
          <VideoTile stream={localStream} muted label={t("localVideo")} />
          <VideoTile stream={remoteStream} label={t("remoteVideo")} />
        </div>
      )}
    </div>
  );
}
