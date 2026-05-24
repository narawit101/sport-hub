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
        <div className="head-titel">
          <h1>ลืมรหัสผ่าน</h1>
        </div>
        {canRead && (
          <form onSubmit={onSubmit}>
            <div className="input-foget-password">
              <input
                maxLength={100}
                required
                type="email"
                placeholder="ใส่ Email ของคุณ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {sentEmail && (
              <div className="btn-submit-reset-password">
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
                    "ยืนยัน "
                  )}
                </button>
              </div>
            )}
          </form>
        )}
        {!canRead && (
          <div className="input-foget-password">
            <input readOnly required value={email} />
          </div>
        )}
        {canEnterOTP && (
          <div className="input-foget-password">
            <input
              required
              type="text"
              minLength={6}
              maxLength={6}
              placeholder="ใส่ OTP"
              value={otp}
              onChange={(e) => setOTP(e.target.value)}
            />
          </div>
        )}

        {canEnterOTP && (
          <div className="btn-submit-reset-password">
            <button
              type="button"
              style={{
                cursor: startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={startProcessLoad}
              onClick={verifyOTP}
            >
              {startProcessLoad ? (
                <span className="dot-loading">
                  <span className="dot one">●</span>
                  <span className="dot two">●</span>
                  <span className="dot three">●</span>
                </span>
              ) : (
                "ยืนยัน OTP"
              )}
            </button>
          </div>
        )}
        {canEnterOTP && (
          <div className="btn-resend">
            <button
              style={{
                cursor:
                  !canRequestOTP || startProcessLoad
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={!canRequestOTP}
              type="button"
              onClick={reSentOTP}
            >
              ขอ OTP ใหม่
            </button>
          </div>
        )}
        {!canRequestOTP && <p>กรุณารอ {timer} วินาทีก่อนขอ OTP ใหม่</p>}
        <Link href="/login" className="login-reset-password">
          กลับหน้า Login
        </Link>
      </div>
    </div>
  );
}
