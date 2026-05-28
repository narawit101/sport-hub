"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/home-page.css";
import { useAuth } from "@/app/contexts/AuthContext";
import Category from "@/components/admin/SportType";
import { USER_STATUS } from "@/constants/status";
import FieldFeed from "@/components/home/FieldFeed";
import FotMobWidget from "@/components/home/FotMobWidget";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [activeSidebarTab, setActiveSidebarTab] = useState("feed"); // feed | football
  const [activeFeedTab, setActiveFeedTab] = useState("general"); // general | following
  const [hideTabs, setHideTabs] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const feedScrollRef = useRef(null);
  const lastScrollTop = useRef(0);

  // Auth check status
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user?.status !== USER_STATUS.VERIFIED) {
        router.push("/verification");
      }
    }
  }, [user, isLoading, router]);

  // Reset tab hide state when switching sidebar tabs
  useEffect(() => {
    setHideTabs(false);
    lastScrollTop.current = 0;
  }, [activeSidebarTab]);

  // Detect scroll direction to hide/show sticky headers
  useEffect(() => {
    const scrollContainer = feedScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      if (scrollTop < 0) return; // Prevent bounce trigger

      if (Math.abs(scrollTop - lastScrollTop.current) > 5) {
        if (scrollTop > lastScrollTop.current && scrollTop > 40) {
          setHideTabs(true);
        } else {
          setHideTabs(false);
        }
      }
      lastScrollTop.current = scrollTop;
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [activeSidebarTab]);

  const handleSidebarTabClick = (tab) => {
    if (activeSidebarTab === tab) {
      if (feedScrollRef.current) {
        feedScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      setActiveSidebarTab(tab);
    }
  };

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
          {/* Refactored Layout: Single Column for Football content */}

          <div className="homepage-content-grid">
            {/* Unified Container: Sidebar + Feed */}
            <div className={`homepage-left-container ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
              {/* Column 1: Left Sidebar (TikTok style) */}
              <div className={`homepage-sidebar-left ${sidebarCollapsed ? "collapsed" : ""}`}>
                <button
                  className="sidebar-toggle-button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  aria-label={sidebarCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {sidebarCollapsed ? (
                      <polyline points="9 18 15 12 9 6" />
                    ) : (
                      <polyline points="15 18 9 12 15 6" />
                    )}
                  </svg>
                </button>

                <button
                  className={`sidebar-left-item ${activeSidebarTab === "feed" ? "active" : ""}`}
                  onClick={() => handleSidebarTabClick("feed")}
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
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M16 8h2" />
                    <path d="M16 12h2" />
                    <path d="M16 16h2" />
                    <path d="M6 8h6v8H6z" />
                  </svg>
                  <span className="sidebar-label">ข่าวสารระบบ</span>
                </button>

                <button
                  className={`sidebar-left-item ${activeSidebarTab === "football" ? "active" : ""}`}
                  onClick={() => handleSidebarTabClick("football")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                    className="sidebar-icon"
                  >
                    <path
                      fill="currentColor"
                      d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10s10-4.49 10-10S17.51 2 12 2m6.23 15H16l-1.25 2.5c-.86.32-1.78.5-2.75.5s-1.89-.18-2.75-.5L8 17H5.77a8 8 0 0 1-1.63-3.53L6 10.99L4.78 8.56a8.02 8.02 0 0 1 4.79-4.19L12 5.99l2.43-1.62c2.11.68 3.84 2.21 4.79 4.19L18 11l1.86 2.48A8.1 8.1 0 0 1 18.24 17Z"
                    ></path>
                    <path
                      fill="currentColor"
                      d="m8.5 11l1.5 4h4l1.5-4L12 8.5z"
                    ></path>
                  </svg>
                  <span className="sidebar-label">ข่าวกีฬา & ผลบอล</span>
                </button>
              </div>
              {/* Column 2: Center Content Area (Conditional render) */}
              <div className="homepage-main-content-column" ref={feedScrollRef}>
                {activeSidebarTab === "football" ? (
                  <div className="homepage-football-column">
                    <FotMobWidget hideTabs={hideTabs} />
                  </div>
                ) : (
                  <div className="homepage-feed-wrapper">
                    {user && (
                      <div
                        className={`football-tabs feed-sub-tabs ${hideTabs ? "scroll-hide" : ""}`}
                      >
                        <button
                          className={`football-tab-btn ${activeFeedTab === "general" ? "active" : ""}`}
                          onClick={() => handleFeedTabClick("general")}
                        >
                          สำหรับคุณ
                        </button>
                        <button
                          className={`football-tab-btn ${activeFeedTab === "following" ? "active" : ""}`}
                          onClick={() => handleFeedTabClick("following")}
                        >
                          กำลังติดตาม
                        </button>
                      </div>
                    )}
                    <FieldFeed
                      activeFeedTab={activeFeedTab}
                      scrollRef={feedScrollRef}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
