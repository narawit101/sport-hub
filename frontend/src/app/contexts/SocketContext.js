"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { createSocket, logSocketError } from "@/lib/socket";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!API_URL) {
      console.warn("[SocketContext] NEXT_PUBLIC_API_URL is not defined");
      return;
    }

    const newSocket = createSocket(API_URL);
    if (!newSocket) return;

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("[SocketContext] Connected:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      logSocketError("Global", err);
    });

    return () => {
      if (newSocket) {
        console.log("[SocketContext] Disconnecting...");
        newSocket.disconnect();
      }
    };
  }, [API_URL]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
