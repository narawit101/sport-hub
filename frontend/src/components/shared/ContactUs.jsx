"use client";
import { useState, useEffect } from "react";
import "@/app/css/contact-us.css";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";

export default function Contact() {
  const router = useRouter();
  const { notify } = useNotification();
  const [userEmail, setUserEmail] = useState("");
  const [subJect, setSubject] = useState("");
  const [conTent, setContent] = useState("");
  const [timer, setTimer] = useState(60);
  const [canRequest, setCanRequest] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (timer === 0) {
      setCanRequest(true);
    } else if (!canRequest) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer, canRequest]);

  const request = async (e) => {
    e.preventDefault();

    if (!canRequest) {
      notify("กรุณารอสักครู่ก่อนส่งคำขอใหม่", "error");
      return;
    }
    if (!userEmail || !subJect || !conTent) {
      notify("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
      return;
    }

    SetstartProcessLoad(true);
    try {
      const result = await apiClient.post("/users/contact-admin", {
        email: userEmail,
        subJect: subJect,
        conTent: conTent,
      });

      notify(
        `ส่งข้อความเรียบร้อย กรุณารอข้อความตอบกลับจากผู้ดูแลระบบที่ ${userEmail}`, "success"
      );
      setCanRequest(false);
      setTimer(60);
      setUserEmail("");
      setSubject("");
      setContent("");
    } catch (error) {
      console.error(error);
      if (error.status === 429 && error.code === "RATE_LIMIT") {
        router.push("/api-rate-limited");
        return;
      }
      notify(error.message || "เกิดข้อผิดพลาดในการส่งคำขอ", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  return (
    <>
      <div className="contact-container">
        <div className="contact-header">
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
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="contact-title">ติดต่อผู้ดูแลระบบ</h1>
          <p className="contact-subtitle">
            แจ้งปัญหาการใช้งาน ส่งข้อเสนอแนะ หรือสอบถามข้อมูลเพิ่มเติมเกี่ยวกับบริการของเรา
          </p>
        </div>

        <form onSubmit={request} className="contact-form">
          <div className="form-group">
            <label>อีเมลสำหรับติดต่อกลับ</label>
            <input
              readOnly={startProcessLoad}
              required
              type="email"
              placeholder="กรอกอีเมลของคุณ เช่น example@mail.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>หัวข้อ / เรื่องที่ต้องการติดต่อ</label>
            <input
              required
              readOnly={startProcessLoad}
              maxLength={50}
              type="text"
              placeholder="กรอกหัวข้อหรือเรื่องที่ต้องการติดต่อ"
              value={subJect}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>รายละเอียดข้อความ</label>
            <textarea
              readOnly={startProcessLoad}
              maxLength={500}
              required
              placeholder="ระบุข้อความ รายละเอียดปัญหา หรือข้อเสนอแนะที่ต้องการแจ้งแก่ผู้ดูแลระบบ"
              value={conTent}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="form-actions-contact">
            <button
              className="send-contact-btn"
              disabled={!canRequest || startProcessLoad}
              type="submit"
            >
              {startProcessLoad ? (
                <span className="dot-loading">
                  <span className="dot one">●</span>
                  <span className="dot two">●</span>
                  <span className="dot three">●</span>
                </span>
              ) : (
                <>
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
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>ส่งข้อความ</span>
                </>
              )}
            </button>
            
            {!canRequest && (
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
                <span>กรุณารอ {timer} วินาทีก่อนส่งข้อความอีกครั้ง</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
