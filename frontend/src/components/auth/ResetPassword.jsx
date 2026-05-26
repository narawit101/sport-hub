"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import "@/app/css/reset-password.css";
import { useNotification } from "@/app/contexts/NotificationContext";
import Link from "next/link";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import apiClient from "@/lib/apiClient";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState("");
  const router = useRouter("");
  const { notify } = useNotification();
  const [canEnterOTP, setCanEnterOTP] = useState(false);
  const [sentEmail, setSentEmail] = useState(true);
  const [canRead, setCanRead] = useState(true);
  const [timer, setTimer] = useState(60); 
  const [canRequestOTP, setCanRequestOTP] = useState(true); 
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (timer === 0) {
      setCanRequestOTP(true);
    } else if (!canRequestOTP) {
      const interval = setInterval(() => {
        setTimer((preTimer) => preTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, canRequestOTP]);

  const onSubmit = async (e) => {
    e.preventDefault();
    SetstartProcessLoad(true);
    try {
      const result = await apiClient.post("/users/reset-password", { email });

      notify(`ส่ง OTP ไปที่ ${email} สำเร็จ`, "success");
      sessionStorage.setItem("user", JSON.stringify(result.user)); 
      sessionStorage.setItem("expiresAt", JSON.stringify(result.expiresAt)); 
      setCanEnterOTP(true);
      setSentEmail(false);
      setCanRead(false);
    } catch (error) {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("expiresAt");
      notify(error.message || "เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const reSentOTP = async (e) => {
    e.preventDefault();

    if (!canRequestOTP) {
      notify("กรุณารอสักครู่ก่อนขอ OTP ใหม่", "error");
      return;
    }
    setCanRequestOTP(false);
    setTimer(60);
    SetstartProcessLoad(true);
    try {
      const result = await apiClient.post("/users/resent-reset-password", { email });

      notify(`ส่ง OTP ใหม่ไปที่ ${email} สำเร็จ`, "success");
      sessionStorage.setItem("user", JSON.stringify(result.user)); 
      sessionStorage.setItem("expiresAt", JSON.stringify(result.expiresAt));
    } catch (error) {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("expiresAt");
      router.replace("/reset-password");
      notify(error.message || "เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();

    const user_id = sessionStorage.getItem("user");

    if (!user_id) {
      notify("ไม่พบข้อมูลผู้ใช้ในระบบ", "error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      await apiClient.post("/users/verify-otp", { email, otp });

      notify("ยืนยัน OTP สำเร็จ กำลังเข้าสู่การรีเซ็ตรหัสผ่าน", "success");
      setTimeout(() => {
        router.replace("/confirm-reset-password");
      }, 1000);
    } catch (error) {
      notify(error.message || "เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  return (
    <div>
      <div className="reset_password_container">
        <div className="reset-password-header">
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
              <circle cx="12" cy="16" r="1" />
            </svg>
          </div>
          <h1 className="reset-password-title">ลืมรหัสผ่าน</h1>
          <p className="reset-password-subtitle">
            {!canEnterOTP
              ? "กรุณาระบุอีเมลที่ใช้สมัครบัญชี เพื่อรับรหัสผ่าน OTP ในการรีเซ็ตรหัสผ่านใหม่"
              : "ระบบได้ส่งรหัส OTP ไปยังอีเมลของท่านแล้ว กรุณากรอกรหัสเพื่อดำเนินการต่อ"}
          </p>
        </div>

        <form onSubmit={canEnterOTP ? verifyOTP : onSubmit} className="reset-password-form">
          {canRead ? (
            <div className="form-group">
              <label>อีเมลของคุณ</label>
              <input
                maxLength={100}
                required
                type="email"
                placeholder="กรอกอีเมลของคุณ เช่น example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          ) : (
            <div className="form-group">
              <label>อีเมลที่ต้องการรีเซ็ต</label>
              <input readOnly required value={email} className="email-readonly" />
            </div>
          )}

          {canEnterOTP && (
            <div className="form-group animate-fade-in">
              <label>รหัสผ่าน OTP 6 หลัก</label>
              <input
                required
                type="text"
                minLength={6}
                maxLength={6}
                placeholder="กรอกรหัส OTP"
                value={otp}
                onChange={(e) => setOTP(e.target.value)}
                className="otp-input"
              />
            </div>
          )}

          <div className="form-actions-reset">
            {!canEnterOTP ? (
              sentEmail && (
                <button
                  type="submit"
                  className="submit-reset-btn"
                  disabled={startProcessLoad}
                >
                  {startProcessLoad ? (
                    <span className="dot-loading">
                      <span className="dot one">●</span>
                      <span className="dot two">●</span>
                      <span className="dot three">●</span>
                    </span>
                  ) : (
                    "ขอรับรหัส OTP"
                  )}
                </button>
              )
            ) : (
              <button
                type="submit"
                className="submit-reset-btn"
                disabled={startProcessLoad}
              >
                {startProcessLoad ? (
                  <span className="dot-loading">
                    <span className="dot one">●</span>
                    <span className="dot two">●</span>
                    <span className="dot three">●</span>
                  </span>
                ) : (
                  "ยืนยันรหัส OTP"
                )}
              </button>
            )}
          </div>

          {canEnterOTP && (
            <div className="resend-otp-section">
              <button
                className="resend-otp-btn"
                disabled={!canRequestOTP || startProcessLoad}
                type="button"
                onClick={reSentOTP}
              >
                ขอรหัส OTP อีกครั้ง
              </button>
              
              {!canRequestOTP && (
                <div className="rate-limit-warning">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: "6px" }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>กรุณารอ {timer} วินาทีก่อนขอ OTP ใหม่</span>
                </div>
              )}
            </div>
          )}
        </form>

        <div className="back-to-login-wrapper">
          <Link href="/login" className="login-reset-password">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "8px" }}
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>กลับหน้าเข้าสู่ระบบ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
