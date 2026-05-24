import { io } from "socket.io-client";

const DEFAULT_SOCKET_OPTIONS = {
  withCredentials: true,
  transports: ["polling", "websocket"],
  timeout: 5000,
  reconnection: true,
  reconnectionAttempts: 3,
};

export function createSocket(apiUrl, options = {}) {
  if (!apiUrl) return null;

  return io(apiUrl, {
    ...DEFAULT_SOCKET_OPTIONS,
    ...options,
  });
}

export function logSocketError(scope, err) {
  const message = err?.message || "unknown socket error";
  console.warn(`[Socket:${scope}] ${message}`);
}
