import { io, type Socket } from "socket.io-client";
import { getToken } from "./auth";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3008";

const activeSockets = new Map<string, Socket>();
const refCounts = new Map<string, number>();

export function createConnection(namespace: string): Socket {
  const count = refCounts.get(namespace) ?? 0;
  refCounts.set(namespace, count + 1);

  const existing = activeSockets.get(namespace);
  if (existing) return existing;

  const socket = io(`${WS_URL}${namespace}`, {
    auth: { token: getToken() },
  });

  activeSockets.set(namespace, socket);
  return socket;
}

export function closeConnection(namespace: string) {
  const count = (refCounts.get(namespace) ?? 1) - 1;

  if (count <= 0) {
    refCounts.delete(namespace);
    const socket = activeSockets.get(namespace);
    if (socket) {
      socket.disconnect();
      activeSockets.delete(namespace);
    }
    return;
  }

  refCounts.set(namespace, count);
}
