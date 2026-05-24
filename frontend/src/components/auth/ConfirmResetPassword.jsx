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
        <div className="confirm-reset-password-head-titel">
          <h1>เปลี่ยนรหัสผ่าน</h1>
        </div>

        <form
          action={handlePasswordChange}
          className="confirm-reset-password-form"
        >
          <label className="newpassword-title">รหัสใหม่</label>
          <div className="input-comfirm-resert">
            <div className="password-wrapper-confirm">
              <input
                maxLength={50}
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password-btn-confirm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "ซ่อน" : "แสดง"}
              </button>
            </div>
          </div>

          <label className="newpassword-title">ยืนยันรหัสใหม่</label>
          <div className="input-comfirm-resert">
            <div className="password-wrapper-confirm">
              <input
                maxLength={50}
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password-btn-confirm"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "ซ่อน" : "แสดง"}
              </button>
            </div>
          </div>

          <div className="icon-lock-input-reset-password">
            <p>
              รหัสผ่านใหม่ต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่[A-Z], พิมพ์เล็ก[a-z],
              ตัวเลข[0-9] และอักขระพิเศษ[!@#$%^&*] 10 ตัวขึ้นไป
            </p>
          </div>
          <div className="btn-confirm-reset-password">
            <button
              type="submit"
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
          </div>
        </form>
      </div>
    </div>
  );
}
