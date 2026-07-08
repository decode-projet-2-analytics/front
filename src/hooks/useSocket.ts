"use client";

import { closeConnection, createConnection } from "@/lib/socket";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

export type SocketConnectionState =
    | "connecting"
    | "connected"
    | "disconnected"
    | "error";

export function useSocket(namespace: string) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connectionState, setConnectionState] = useState<SocketConnectionState>("connecting");

    useEffect(() => {
        const socket = createConnection(namespace);
        setSocket(socket);

        function onConnect() {
            setConnectionState("connected");
        }

        function onDisconnect() {
            setConnectionState("disconnected");
        }

        function onConnectError() {
            setConnectionState("error");
        }

        if (socket.connected) {
            setConnectionState("connected");
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", onConnectError);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("connect_error", onConnectError);
            closeConnection(namespace);
            setSocket(null);
        };
    }, [namespace]);

    return { socket, connectionState };
}
