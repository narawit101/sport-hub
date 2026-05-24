"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/change-password.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { useNotification } from "@/app/contexts/NotificationContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import apiClient from "@/lib/apiClient";
import { USER_STATUS } from "@/constants/status";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { notify } = useNotification();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user?.status !== USER_STATUS.VERIFIED) {
      router.replace("/verification");
    }
  }, [user, isLoading, router]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword.length < 10) {
      notify("รหัสผ่านใหม่ต้องขั้นต่ำ 10 ตัว", "error");
      return;
    }
    if (confirmPassword.length < 10) {
      notify("ยืนยันรหัสผ่านต้องขั้นต่ำ 10 ตัว", "error");
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      notify(
        "รหัสผ่านใหม่ต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่[A-Z], พิมพ์เล็ก[a-z], ตัวเลข[0-9] และอักขระพิเศษ[!@#$%^&*]",
        "error"
      );
      return;
    }
    if (!passwordRegex.test(confirmPassword)) {
      notify(
        "ยืนยันรหัสผ่านต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่[A-Z], พิมพ์เล็ก[a-z], ตัวเลข[0-9] และอักขระพิเศษ[!@#$%^&*]",
        "error"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      notify("รหัสใหม่และการยืนยันรหัสไม่ตรงกัน", "error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      await apiClient.post(`/users/${user.user_id}/check-password`, { currentPassword });

      await apiClient.put(`/users/${user.user_id}/change-password`, { password: newPassword });

      notify("รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      notify(err.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
      console.error(err);
    } finally {
      SetstartProcessLoad(false);
    }
  };

  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <div>
      <div className="change-password-container">
        {isLoading && (
          <div className="loading-data">
            <div className="loading-data-spinner"></div>
          </div>
        )}
        <h2 className="change-password-head">เปลี่ยนรหัสผ่าน</h2>
        <form onSubmit={handlePasswordChange} className="changepassword-form">
          <label className="change-reset-password">รหัสเดิม:</label>
          <input
            maxLength={50}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <label className="change-reset-password">รหัสใหม่:</label>
          <input
            maxLength={50}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <label className="change-reset-password">ยืนยันรหัสใหม่:</label>
          <input
            maxLength={50}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="save-btn"
            style={{
              cursor: startProcessLoad ? "not-allowed" : "pointer",
            }}
            disabled={startProcessLoad}
          >
            {startProcessLoad ? (
              <span className="dot-loading">
                <span className="dot one">●</span>
                <span className="dot two">●</span>
                <span className="dot three">●</span>
              </span>
            ) : (
              "บันทึก"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
