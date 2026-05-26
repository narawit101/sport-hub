"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
        
        <div className="change-password-header">
          <div className="header-icon-wrapper">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="change-password-head">เปลี่ยนรหัสผ่าน</h2>
        </div>

        <div className="password-requirements-box">
          <p className="requirements-title">ข้อกำหนดการตั้งรหัสผ่านใหม่:</p>
          <ul className="requirements-list">
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>ความยาวอย่างน้อย 10 ตัวอักษร</span>
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>ประกอบด้วยตัวอักษรพิมพ์ใหญ่ (A-Z) และพิมพ์เล็ก (a-z)</span>
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>ประกอบด้วยตัวเลข (0-9)</span>
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>ประกอบด้วยอักขระพิเศษอย่างน้อยหนึ่งตัว (เช่น !@#$%)</span>
            </li>
          </ul>
        </div>

        <form onSubmit={handlePasswordChange} className="changepassword-form">
          <div className="form-group">
            <label className="change-reset-password">รหัสเดิม:</label>
            <input
              maxLength={50}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="change-reset-password">รหัสใหม่:</label>
            <input
              maxLength={50}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="change-reset-password">ยืนยันรหัสใหม่:</label>
            <input
              maxLength={50}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="save-btn"
              disabled={startProcessLoad}
            >
              {startProcessLoad ? (
                <span className="dot-loading">
                  <span className="dot one">●</span>
                  <span className="dot two">●</span>
                  <span className="dot three">●</span>
                </span>
              ) : (
                "บันทึกรหัสผ่าน"
              )}
            </button>
            <Link href="/edit-profile" className="back-link-btn">
              ย้อนกลับ
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
