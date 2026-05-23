"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { io } from "socket.io-client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/users/me`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("updated_status", (data) => {
      const currentUser = userRef.current;
      if (currentUser && parseInt(currentUser.user_id) === parseInt(data.userId)) {
        fetchUser();
      }
    });

    socket.on("profile_updated", (data) => {
      const currentUser = userRef.current;
      if (currentUser && parseInt(currentUser.user_id) === parseInt(data.userId)) {
        fetchUser();
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    return () => socket.disconnect();
  }, [API_URL, fetchUser]);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
