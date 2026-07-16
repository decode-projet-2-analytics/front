"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { CHAT_EVENTS } from "@/lib/chatEvents";

export type CallState =
  | "idle"
  | "outgoing"
  | "incoming"
  | "connecting"
  | "in-call"
  | "ended";

interface UseSupportCallOptions {
  socket: Socket | null;
  conversationId: string;
  enabled: boolean;
  peerAvailable: boolean;
}

interface IncomingCallPayload {
  conversationId: string;
  callId: string;
  callerId: number;
  callerFirstname: string | null;
  media: { audio: boolean; video: boolean };
}

const OUTGOING_TIMEOUT_MS = 45_000;

const TURN_URL = process.env.NEXT_PUBLIC_TURN_URL as string;

export function useSupportCall({
  socket,
  conversationId,
  enabled,
  peerAvailable,
}: UseSupportCallOptions) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(
    null,
  );

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef<string | null>(null);
  const callStateRef = useRef<CallState>("idle");
  const isCallerRef = useRef(false);
  const outgoingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const cleanup = useCallback(() => {
    if (outgoingTimeoutRef.current) {
      clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    callIdRef.current = null;
    isCallerRef.current = false;
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingCall(null);
    setCallError(null);
    setCallState("idle");
  }, []);

  const resetToEnded = useCallback(() => {
    cleanup();
    setCallState("ended");
    window.setTimeout(() => setCallState("idle"), 1500);
  }, [cleanup]);

  const getPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: TURN_URL,
          username: "decode",
          credential: "rRNkwhyz31FMRDWM8f8OYM6pjx8YY0WgOo9HtsTwVLA=",
        },
      ],
      iceTransportPolicy: "relay",
    });

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
      setCallState("in-call");
    };

    pc.oniceconnectionstatechange = () => {
      console.info("[call] ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        setCallError("connectionFailed");
      }
    };

    pc.onconnectionstatechange = () => {
      console.info("[call] peer connection state:", pc.connectionState);
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate || !socket?.connected || !callIdRef.current) return;

      socket.emit(CHAT_EVENTS.CALL_ICE_CANDIDATE, {
        conversationId,
        callId: callIdRef.current,
        candidate: event.candidate,
      });
    };

    pcRef.current = pc;
    return pc;
  }, [conversationId, socket]);

  const acquireLocalMedia = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    localStreamRef.current = stream;
    setLocalStream(stream);

    const pc = getPeerConnection();
    stream.getTracks().forEach((track) => {
      const exists = pc.getSenders().some((sender) => sender.track?.id === track.id);
      if (!exists) {
        pc.addTrack(track, stream);
      }
    });

    return stream;
  }, [getPeerConnection]);

  const startCall = useCallback(async () => {
    if (!socket?.connected || !enabled || !peerAvailable) return;
    if (callStateRef.current !== "idle") return;

    const callId = crypto.randomUUID();
    callIdRef.current = callId;
    isCallerRef.current = true;
    setCallState("outgoing");
    setCallError(null);

    socket.emit(CHAT_EVENTS.CALL_INVITE, {
      conversationId,
      callId,
      media: { audio: false, video: true },
    });

    outgoingTimeoutRef.current = setTimeout(() => {
      if (callIdRef.current === callId) {
        socket.emit(CHAT_EVENTS.CALL_CANCEL, { conversationId, callId });
        resetToEnded();
      }
    }, OUTGOING_TIMEOUT_MS);
  }, [socket, enabled, peerAvailable, conversationId, resetToEnded]);

  const acceptCall = useCallback(async () => {
    if (!socket?.connected || !incomingCall || callStateRef.current !== "incoming") {
      return;
    }

    const { callId: activeCallId } = incomingCall;
    callIdRef.current = activeCallId;
    isCallerRef.current = false;
    setIncomingCall(null);
    setCallState("connecting");
    setCallError(null);

    try {
      await acquireLocalMedia();

      socket.emit(CHAT_EVENTS.CALL_ACCEPT, {
        conversationId,
        callId: activeCallId,
      });
    } catch {
      setCallError("mediaAccessDenied");
      socket.emit(CHAT_EVENTS.CALL_REJECT, {
        conversationId,
        callId: activeCallId,
      });
      resetToEnded();
    }
  }, [socket, incomingCall, conversationId, acquireLocalMedia, resetToEnded]);

  const rejectCall = useCallback(() => {
    if (!incomingCall || !socket?.connected) return;

    socket.emit(CHAT_EVENTS.CALL_REJECT, {
      conversationId,
      callId: incomingCall.callId,
    });
    cleanup();
  }, [incomingCall, socket, conversationId, cleanup]);

  const cancelCall = useCallback(() => {
    if (!callIdRef.current || !socket?.connected || callStateRef.current !== "outgoing") {
      return;
    }

    socket.emit(CHAT_EVENTS.CALL_CANCEL, {
      conversationId,
      callId: callIdRef.current,
    });
    resetToEnded();
  }, [socket, conversationId, resetToEnded]);

  const endCall = useCallback(() => {
    if (callIdRef.current && socket?.connected) {
      socket.emit(CHAT_EVENTS.CALL_END, {
        conversationId,
        callId: callIdRef.current,
        reason: "hangup",
      });
    }
    resetToEnded();
  }, [socket, conversationId, resetToEnded]);

  useEffect(() => {
    if (!socket || !enabled) return;

    const activeSocket = socket;

    async function onAccepted({
      conversationId: id,
      callId: activeCallId,
    }: {
      conversationId: string;
      callId: string;
    }) {
      if (id !== conversationId || !isCallerRef.current) return;

      if (outgoingTimeoutRef.current) {
        clearTimeout(outgoingTimeoutRef.current);
        outgoingTimeoutRef.current = null;
      }

      setCallState("connecting");

      try {
        await acquireLocalMedia();
        const pc = getPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        activeSocket.emit(CHAT_EVENTS.CALL_OFFER, {
          conversationId,
          callId: activeCallId,
          sdp: offer,
        });
      } catch {
        setCallError("mediaAccessDenied");
        activeSocket.emit(CHAT_EVENTS.CALL_END, {
          conversationId,
          callId: activeCallId,
          reason: "media_error",
        });
        resetToEnded();
      }
    }

    async function onOffer({
      conversationId: id,
      callId: activeCallId,
      sdp,
    }: {
      conversationId: string;
      callId: string;
      sdp: RTCSessionDescriptionInit;
    }) {
      if (id !== conversationId || isCallerRef.current) return;

      callIdRef.current = activeCallId;

      try {
        await acquireLocalMedia();
        const pc = getPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        activeSocket.emit(CHAT_EVENTS.CALL_ANSWER, {
          conversationId,
          callId: activeCallId,
          sdp: answer,
        });
      } catch {
        setCallError("connectionFailed");
        resetToEnded();
      }
    }

    async function onAnswer({
      conversationId: id,
      sdp,
    }: {
      conversationId: string;
      sdp: RTCSessionDescriptionInit;
    }) {
      if (id !== conversationId || !isCallerRef.current || !pcRef.current) return;

      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch {
        setCallError("connectionFailed");
      }
    }

    async function onCandidate({
      conversationId: id,
      candidate,
    }: {
      conversationId: string;
      candidate: RTCIceCandidateInit;
    }) {
      if (id !== conversationId || !pcRef.current) return;

      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // ignore late candidates
      }
    }

    function onIncoming(payload: IncomingCallPayload) {
      if (payload.conversationId !== conversationId) return;
      if (callStateRef.current !== "idle") return;

      callIdRef.current = payload.callId;
      setIncomingCall(payload);
      setCallState("incoming");
    }

    function onRejected({ conversationId: id }: { conversationId: string }) {
      if (id !== conversationId) return;
      resetToEnded();
    }

    function onCancelled({ conversationId: id }: { conversationId: string }) {
      if (id !== conversationId) return;
      cleanup();
    }

    function onEnded({ conversationId: id }: { conversationId: string }) {
      if (id !== conversationId) return;
      resetToEnded();
    }

    activeSocket.on(CHAT_EVENTS.CALL_INCOMING, onIncoming);
    activeSocket.on(CHAT_EVENTS.CALL_ACCEPTED, onAccepted);
    activeSocket.on(CHAT_EVENTS.CALL_OFFER, onOffer);
    activeSocket.on(CHAT_EVENTS.CALL_ANSWER, onAnswer);
    activeSocket.on(CHAT_EVENTS.CALL_ICE_CANDIDATE, onCandidate);
    activeSocket.on(CHAT_EVENTS.CALL_REJECTED, onRejected);
    activeSocket.on(CHAT_EVENTS.CALL_CANCELLED, onCancelled);
    activeSocket.on(CHAT_EVENTS.CALL_ENDED, onEnded);

    return () => {
      activeSocket.off(CHAT_EVENTS.CALL_INCOMING, onIncoming);
      activeSocket.off(CHAT_EVENTS.CALL_ACCEPTED, onAccepted);
      activeSocket.off(CHAT_EVENTS.CALL_OFFER, onOffer);
      activeSocket.off(CHAT_EVENTS.CALL_ANSWER, onAnswer);
      activeSocket.off(CHAT_EVENTS.CALL_ICE_CANDIDATE, onCandidate);
      activeSocket.off(CHAT_EVENTS.CALL_REJECTED, onRejected);
      activeSocket.off(CHAT_EVENTS.CALL_CANCELLED, onCancelled);
      activeSocket.off(CHAT_EVENTS.CALL_ENDED, onEnded);
    };
  }, [
    socket,
    enabled,
    conversationId,
    acquireLocalMedia,
    getPeerConnection,
    cleanup,
    resetToEnded,
  ]);

  return {
    callState,
    localStream,
    remoteStream,
    callError,
    incomingCall,
    canStartCall: enabled && peerAvailable && callState === "idle",
    startCall,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
  };
}
