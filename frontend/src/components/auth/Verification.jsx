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
        <div className="head-titel">
          <h1>ยืนยันบัญชีของคุณก่อนใช้บริการ</h1>
        </div>
        <form onSubmit={onSave}>
          <div className="input-verify">
            <input
              required
              maxLength={6}
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <div className="btn-submit-verify">
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
                "ยืนยัน E-mail"
              )}
            </button>
          </div>
          <div className="btn-resend-otp">
            <button
              style={{
                cursor:
                  !canRequestOTP || startProcessLoad
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={!canRequestOTP}
              type="button"
              onClick={requestOTP}
            >
              ขอรหัสใหม่
            </button>
            {!canRequestOTP && <p>กรุณารอ {timer} วินาทีก่อนขอ OTP ใหม่</p>}
            <p> (OTP มีเวลา 5 นาที ถ้าหมดต้องกดขอใหม่) </p>
          </div>
        </form>
      </div>
    </>
  );
}
