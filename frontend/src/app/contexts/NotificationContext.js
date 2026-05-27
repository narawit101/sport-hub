"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const NotificationContext = createContext();

/**
 * Global Notification Provider.
 * Provides a simple 'notify' function to display success/error messages.
 */
export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [isHiding, setIsHiding] = useState(false);

  const notify = useCallback((text, type = "success", duration = 3000) => {
    setIsHiding(false);
    setNotification({ text, type, duration, id: Date.now() });
  }, []);

  useEffect(() => {
    if (notification) {
      // Start hiding animation slightly before the actual removal
      const hideTimer = setTimeout(() => {
        setIsHiding(true);
      }, notification.duration - 300);

      const removeTimer = setTimeout(() => {
        setNotification(null);
        setIsHiding(false);
      }, notification.duration);

      return () => {
        clearTimeout(hideTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [notification]);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notification && (
        <div 
          key={notification.id} 
          className={`message-box ${notification.type} ${isHiding ? "hiding" : ""}`}
        >
          <p>{notification.text}</p>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
