"use client";
import React, { useState } from "react";
import "@/app/css/logout.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useNotification } from "@/app/contexts/NotificationContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import apiClient from "@/lib/apiClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

export default function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const { notify } = useNotification();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad);

  const handleLogout = async () => {
    SetstartProcessLoad(true);
    try {
      await apiClient.post("/logout");

      logout();
      sessionStorage.clear();
      notify("ออกจากระบบสำเร็จ", "success");
      router.push("/login");
    } catch (error) {
      console.error("Error:", error);
      notify(error.message || "ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  return (
    <div className="logout-container">
      <button className="logout-button" onClick={handleLogout} disabled={startProcessLoad}>
        <FontAwesomeIcon icon={faSignOutAlt} className="logout-icon" />
        {startProcessLoad ? (
          <span className="dot-loading">
            <span className="dot one">●</span>
            <span className="dot two">●</span>
            <span className="dot three">●</span>
          </span>
        ) : (
          "ออกจากระบบ"
        )}
      </button>
    </div>
  );
}
