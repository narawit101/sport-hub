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
        <div className="head-titel-contact">
          <h1>ติดต่อผู้ดูแลระบบ</h1>
        </div>
        <form onSubmit={request}>
          <div className="input-contact">
            <input
              readOnly={startProcessLoad}
              required
              type="email"
              placeholder="Email ของคุณ (สำหรับการตอบกลับ)"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />

            <input
              required
              readOnly={startProcessLoad}
              maxLength={50}
              type="text"
              placeholder="หัวข้อ, เรื่องที่ต้องการติดต่อ"
              value={subJect}
              onChange={(e) => setSubject(e.target.value)}
            />

            <textarea
              readOnly={startProcessLoad}
              maxLength={500}
              required
              type="text"
              placeholder="เนื้อหา, ข้อความที่ต้องการติดต่อ, แจ้งปัญหา, ข้อเสนอแนะ"
              value={conTent}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="btn-send-contact">
            <button
              style={{
                cursor:
                  !canRequest || startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={!canRequest}
              type="button"
              onClick={request}
            >
              {startProcessLoad ? (
                <span className="dot-loading">
                  <span className="dot one">●</span>
                  <span className="dot two">●</span>
                  <span className="dot three">●</span>
                </span>
              ) : (
                "ส่งข้อความ"
              )}
            </button>
            {!canRequest && <p>กรุณารอ {timer} วินาทีก่อนส่งข้อความ</p>}
          </div>
        </form>
      </div>
    </>
  );
}
