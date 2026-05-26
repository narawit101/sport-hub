"use client";
import { useState, useEffect } from "react";
import "@/app/css/user-verification.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useNotification } from "@/app/contexts/NotificationContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import apiClient from "@/lib/apiClient";
import { USER_STATUS } from "@/constants/status";

export default function Verification() {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [canRequestOTP, setCanRequestOTP] = useState(true);
  const router = useRouter("");
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

    if (user?.status === USER_STATUS.VERIFIED) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  const userId = user?.user_id;
  const userEmail = user?.email;

  useEffect(() => {
    if (timer === 0) {
      setCanRequestOTP(true);
    } else if (!canRequestOTP) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer, canRequestOTP]);

  const onSave = async (e) => {
    e.preventDefault();
    SetstartProcessLoad(true);
    try {
      await apiClient.post(`/register/verify/${userId}`, { otp });

      notify("ยืนยัน E-mail สำเร็จ", "success");
      setTimeout(() => {
        window.location.replace("/");
      }, 2000);
    } catch (error) {
      notify(error.message || "เกิดข้อผิดพลาดระหว่างการยืนยัน", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const requestOTP = async (e) => {
    e.preventDefault();

    if (!canRequestOTP) {
      notify("กรุณารอสักครู่ก่อนขอ OTP ใหม่", "success");
      return;
    }

    SetstartProcessLoad(true);
    try {
      await apiClient.put(`/register/new-otp/${userId}`, { email: userEmail });

      notify(`OTP ใหม่ถูกส่งไปยัง ${userEmail}`, "success");
      setCanRequestOTP(false);
      setTimer(60);
    } catch (error) {
      console.error(error);
      notify(error.message || "เกิดข้อผิดพลาดในการขอ OTP", "error");
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
    <>
      <div className="verification-container">
        <div className="verification-header">
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 11 11 13 15 9" />
            </svg>
          </div>
          <h1 className="verification-title">ยืนยันอีเมลของคุณ</h1>
          <p className="verification-subtitle">
            เราได้ส่งรหัสผ่าน OTP ไปยังอีเมลของท่านแล้ว กรุณากรอกรหัสผ่าน 6 หลักเพื่อยืนยันการลงทะเบียน
          </p>
        </div>

        <form onSubmit={onSave} className="verification-form">
          <div className="form-group">
            <label>รหัสผ่าน OTP 6 หลัก</label>
            <input
              required
              maxLength={6}
              type="text"
              placeholder="กรอกรหัส OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="otp-input"
            />
          </div>

          <div className="form-actions-verify">
            <button
              type="submit"
              className="submit-verify-btn"
              disabled={startProcessLoad}
            >
              {startProcessLoad ? (
                <span className="dot-loading">
                  <span className="dot one">●</span>
                  <span className="dot two">●</span>
                  <span className="dot three">●</span>
                </span>
              ) : (
                "ยืนยันรหัสอีเมล"
              )}
            </button>
          </div>

          <div className="resend-otp-section">
            <button
              className="resend-otp-btn"
              disabled={!canRequestOTP || startProcessLoad}
              type="button"
              onClick={requestOTP}
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
            <p className="otp-expiry-note">
              * รหัส OTP จะมีอายุการใช้งาน 5 นาที หากหมดเวลาต้องกดขอใหม่
            </p>
          </div>
        </form>
      </div>
    </>
  );
}
