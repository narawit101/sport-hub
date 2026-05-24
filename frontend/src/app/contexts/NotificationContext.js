"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const NotificationContext = createContext();

/**
 * Global Notification Provider.
 * Provides a simple 'notify' function to display success/error messages.
 */
export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  /**
   * Show a notification.
   * @param {string} text - Message to display.
   * @param {"success" | "error"} type - Type of notification.
   * @param {number} duration - Time in ms before the notification disappears.
   */
  const notify = useCallback((text, type = "success", duration = 3000) => {
    setNotification({ text, type, duration, id: Date.now() });
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notification && (
        <div key={notification.id} className={`message-box ${notification.type}`}>
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
