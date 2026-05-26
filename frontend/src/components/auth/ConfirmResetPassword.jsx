"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import "@/app/css/confirm-reset-password.css";
import { useNotification } from "@/app/contexts/NotificationContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import apiClient from "@/lib/apiClient";

export default function ConfirmResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter("");
  const { notify } = useNotification();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    const expiresAt = JSON.parse(sessionStorage.getItem("expiresAt"));
    if (expiresAt < Date.now() || !user) {
      sessionStorage.removeItem("expiresAt");
      sessionStorage.removeItem("user");
      router.replace("/reset-password");
    }
  }, [router]);

  const handlePasswordChange = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const user_id = sessionStorage.getItem("user");

    if (!user_id) {
      notify("session หมดอายุกรุณาทำรายการใหม่", "error");
      setTimeout(() => {
        router.replace("/reset-password");
      }, 2000);
      return;
    }

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

    const user = JSON.parse(sessionStorage.getItem("user"));
    if (newPassword !== confirmPassword) {
      notify("รหัสไม่ตรงกัน", "error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      await apiClient.put(`/users/${user.user_id}/change-password-reset`, {
        password: newPassword,
      });

      notify("รหัสผ่านถูกเปลี่ยนเรียบร้อย กรุณาเข้าสู่ระบบอีกครั้ง", "success");
      setConfirmPassword("");
      setNewPassword("");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("expiresAt");
      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (err) {
      notify(err.message || "เกิดข้อผิดพลาด", "error");
      console.error(err);
    } finally {
      SetstartProcessLoad(false);
    }
  };

  return (
    <div>
      <div className="confirm-reset-password-container">
        <div className="confirm-reset-header">
          <div className="header-icon-wrapper">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
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
          <h1 className="confirm-reset-title">ตั้งรหัสผ่านใหม่</h1>
          <p className="confirm-reset-subtitle">
            กรุณาป้อนรหัสผ่านใหม่ที่ปลอดภัยสำหรับบัญชีของท่าน เพื่อดำเนินการตั้งค่ารหัสผ่านใหม่
          </p>
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

        <form
          action={handlePasswordChange}
          className="confirm-reset-password-form"
        >
          <div className="form-group">
            <label className="newpassword-title">รหัสผ่านใหม่</label>
            <div className="password-wrapper-confirm">
              <input
                maxLength={50}
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="ป้อนรหัสผ่านใหม่"
              />
              <button
                type="button"
                className="toggle-password-btn-confirm"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="newpassword-title">ยืนยันรหัสผ่านใหม่</label>
            <div className="password-wrapper-confirm">
              <input
                maxLength={50}
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
              />
              <button
                type="button"
                className="toggle-password-btn-confirm"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <div className="btn-confirm-reset-password">
            <button
              type="submit"
              disabled={startProcessLoad}
            >
              {startProcessLoad ? (
                <span className="dot-loading">
                  <span className="dot one">●</span>
                  <span className="dot two">●</span>
                  <span className="dot three">●</span>
                </span>
              ) : (
                "บันทึกรหัสผ่านใหม่"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
