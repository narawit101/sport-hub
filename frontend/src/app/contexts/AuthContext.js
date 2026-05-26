"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useSocket } from "@/app/contexts/SocketContext";
import apiClient, { tokenStorage } from "@/lib/apiClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const socket = useSocket();

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get("/users/me");
      setUser(data);
    } catch (error) {
      console.error("Error fetching user", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (socket && user?.user_id) {
      console.log(`[AuthContext] Joining socket room: ${user.user_id}`);
      socket.emit("join_room", user.user_id);
    }
  }, [socket, user?.user_id]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdatedStatus = (data) => {
      const currentUser = userRef.current;
      if (currentUser && parseInt(currentUser.user_id) === parseInt(data.userId)) {
        fetchUser();
      }
    };

    const handleProfileUpdated = (data) => {
      const currentUser = userRef.current;
      if (currentUser && parseInt(currentUser.user_id) === parseInt(data.userId)) {
        fetchUser();
      }
    };

    socket.on("updated_status", handleUpdatedStatus);
    socket.on("profile_updated", handleProfileUpdated);

    return () => {
      socket.off("updated_status", handleUpdatedStatus);
      socket.off("profile_updated", handleProfileUpdated);
    };
  }, [socket, fetchUser]);

  // เก็บ token ใน localStorage หลัง login สำเร็จ
  const login = useCallback((token) => {
    if (token) {
      tokenStorage.set(token);
    }
  }, []);

  // ลบ token ออกจาก localStorage เมื่อ logout
  const logout = useCallback(() => {
    tokenStorage.remove();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
