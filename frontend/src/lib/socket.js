import { io } from "socket.io-client";
import { tokenStorage } from "@/lib/apiClient";

const DEFAULT_SOCKET_OPTIONS = {
  withCredentials: true,
  transports: ["polling", "websocket"],
  timeout: 5000,
  reconnection: true,
  reconnectionAttempts: 3,
};

export function createSocket(apiUrl, options = {}) {
  if (!apiUrl) return null;

  // ส่ง token ผ่าน auth option ของ socket.io
  // (fallback สำหรับ mobile ที่บล็อค 3rd-party cookie ทำให้ withCredentials ไม่ส่ง cookie)
  const localToken = tokenStorage.get();
  const authOption = localToken ? { auth: { token: localToken } } : {};

  return io(apiUrl, {
    ...DEFAULT_SOCKET_OPTIONS,
    ...authOption,
    ...options,
  });
}

export function logSocketError(scope, err) {
  const message = err?.message || "unknown socket error";
  console.warn(`[Socket:${scope}] ${message}`);
}
