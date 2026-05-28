"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/home-page.css";
import { useAuth } from "@/app/contexts/AuthContext";
import Category from "@/components/admin/SportType";
import { USER_STATUS } from "@/constants/status";
import FotMobWidget from "@/components/home/FotMobWidget";
import FieldFeed from "@/components/home/FieldFeed";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [activeFeedTab, setActiveFeedTab] = useState("general"); // general | following
  const feedScrollRef = useRef(null);

  // Auth check status
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user?.status !== USER_STATUS.VERIFIED) {
        router.push("/verification");
      }
    }
  }, [user, isLoading, router]);

  const handleFeedTabClick = (tab) => {
    if (activeFeedTab === tab) {
      if (feedScrollRef.current) {
        feedScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      setActiveFeedTab(tab);
    }
  };

  const scrollToBookingSection = () => {
    document
      .querySelector(".section-title-home")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="banner-container">
        <img
          src="/images/baner-img.png"
          alt="ศูนย์กีฬา"
          className="banner-video"
        />

        <div className="banner-text">
          <h1>Online Sports Venue Booking Platform</h1>
          <h2>แพลตฟอร์มจองสนามกีฬาออนไลน์</h2>
          <div className="home-btn">
            <button onClick={scrollToBookingSection}>จองเลย</button>
          </div>
        </div>
      </div>

      <div className="homepage">
        <Category />

        {/* Unified Dashboard Container */}
        <div className="homepage-dashboard-container">
          <div className="title-notice">
            {/* <span className="section-badge">News & Updates</span> */}
            <h1>ความเคลื่อนไหวและข่าวสารต่าง ๆ</h1>
            <p className="section-subtitle">
              ติดตามข่าวสาร กิจกรรมพิเศษ
              และโปรโมชันล่าสุดส่งตรงจากสนามกีฬาที่คุณสนใจ
              พร้อมเกาะติดตารางคะแนนและผลบอลสดรอบโลก
            </p>
          </div>

          {/* Split Grid Layout */}
          <div className="homepage-content-grid">
            {/* Left Unified Container: Sidebar + Feed */}
            <div className="homepage-left-container">
              {/* Column 1: Left Sidebar (TikTok style) */}
              <div className="homepage-sidebar-left">
                <button
                  className={`sidebar-left-item ${activeFeedTab === "general" ? "active" : ""}`}
                  onClick={() => handleFeedTabClick("general")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="sidebar-icon"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span className="sidebar-label">สำหรับคุณ</span>
                </button>

                {user && (
                  <button
                    className={`sidebar-left-item ${activeFeedTab === "following" ? "active" : ""}`}
                    onClick={() => handleFeedTabClick("following")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="sidebar-icon"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="sidebar-label">กำลังติดตาม</span>
                  </button>
                )}
              </div>

              {/* Column 2: Center Feed Column */}
              <FieldFeed
                activeFeedTab={activeFeedTab}
                scrollRef={feedScrollRef}
              />
            </div>

            {/* Column 3: Right Football Column */}
            <div className="homepage-football-column">
              <FotMobWidget />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
