"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/home-page.css";
import { useAuth } from "@/app/contexts/AuthContext";
import Category from "@/components/admin/SportType";
import { USER_STATUS } from "@/constants/status";
import FieldFeed from "@/components/home/FieldFeed";
import FotMobWidget from "@/components/home/FotMobWidget";
import apiClient from "@/lib/apiClient";

const POPULAR_LEAGUES_LIST = [
  { id: 47, name: "Premier League" },
  { id: 8984, name: "Thai League" },
  { id: 87, name: "La Liga" },
  { id: 54, name: "Bundesliga" },
  { id: 55, name: "Serie A" },
  { id: 53, name: "Ligue 1" },
  { id: 42, name: "Champions League" },
  { id: 73, name: "Europa League" },
];

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [activeSidebarTab, setActiveSidebarTab] = useState("feed"); // feed | matches | standings | news
  const [activeFeedTab, setActiveFeedTab] = useState("general"); // general | following
  const [hideTabs, setHideTabs] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Default to opened
  const feedScrollRef = useRef(null);
  const lastScrollTop = useRef(0);

  // League Selector States
  const [selectedLeagueId, setSelectedLeagueId] = useState("47");
  const [allLeagues, setAllLeagues] = useState(null);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [leagueFilter, setLeagueFilter] = useState("");
  const [expandedCountries, setExpandedCountries] = useState({});

  // Auth check status
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user?.status !== USER_STATUS.VERIFIED) {
        router.push("/verification");
      }
    }
  }, [user, isLoading, router]);

  // Fetch leagues list on mount
  useEffect(() => {
    const fetchAllLeagues = async () => {
      setLeaguesLoading(true);
      try {
        const res = await apiClient.get("/fotmob/all-leagues");
        setAllLeagues(res);
      } catch (err) {
        console.error("Error fetching leagues:", err);
      } finally {
        setLeaguesLoading(false);
      }
    };
    fetchAllLeagues();
  }, []);

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

  const handleLeagueSelect = (leagueId) => {
    setSelectedLeagueId(String(leagueId));
    setActiveSidebarTab("standings");
    setTimeout(() => {
      const targetElement =
        document.querySelector(".title-notice") ||
        document.querySelector(".football-widget-container");
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (feedScrollRef.current) {
        feedScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
  };

  const toggleCountryExpand = (ccode) => {
    setExpandedCountries((prev) => ({
      ...prev,
      [ccode]: !prev[ccode],
    }));
  };

  const scrollToBookingSection = () => {
    document
      .querySelector(".section-title-home")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Filter leagues
  const query = leagueFilter.trim().toLowerCase();

  const filteredInternational =
    allLeagues?.international?.filter(
      (league) =>
        league.name.toLowerCase().includes(query) ||
        (league.localizedName &&
          league.localizedName.toLowerCase().includes(query)),
    ) || [];

  const filteredCountries = (allLeagues?.countries || [])
    .map((country) => {
      const countryMatches =
        country.name.toLowerCase().includes(query) ||
        (country.localizedName &&
          country.localizedName.toLowerCase().includes(query));

      const matchingLeagues = country.leagues.filter(
        (league) =>
          league.name.toLowerCase().includes(query) ||
          (league.localizedName &&
            league.localizedName.toLowerCase().includes(query)),
      );

      if (countryMatches) {
        return country;
      } else if (matchingLeagues.length > 0) {
        return { ...country, leagues: matchingLeagues };
      }
      return null;
    })
    .filter(Boolean);

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
            <h1>ความเคลื่อนไหวและข่าวสารต่าง ๆ</h1>
            <p className="section-subtitle">
              ติดตามข่าวสาร กิจกรรมพิเศษ
              และโปรโมชันล่าสุดส่งตรงจากสนามกีฬาที่คุณสนใจ
              พร้อมเกาะติดตารางคะแนนและผลบอลสดรอบโลก
            </p>
          </div>

          <div className="homepage-content-grid">
            <div
              className={`homepage-left-container ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
            >
              {/* Column 1: Left Sidebar */}
              <div
                className={`homepage-sidebar-left ${sidebarCollapsed ? "collapsed" : ""}`}
              >
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

                {/* Tab 1: ข่าวสารระบบ */}
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

                {/* Tab 2: ผลบอลสด */}
                <button
                  className={`sidebar-left-item ${activeSidebarTab === "matches" ? "active" : ""}`}
                  onClick={() => handleSidebarTabClick("matches")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
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
                  <span className="sidebar-label">ผลบอลสด</span>
                </button>

                {/* Tab 3: ตารางคะแนน */}
                <button
                  className={`sidebar-left-item ${activeSidebarTab === "standings" ? "active" : ""}`}
                  onClick={() => handleSidebarTabClick("standings")}
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
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <span className="sidebar-label">ตารางคะแนน</span>
                </button>

                {/* Tab 4: ข่าวฟุตบอล */}
                <button
                  className={`sidebar-left-item ${activeSidebarTab === "news" ? "active" : ""}`}
                  onClick={() => handleSidebarTabClick("news")}
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
                    <line x1="8" y1="9" x2="16" y2="9" />
                    <line x1="8" y1="13" x2="14" y2="13" />
                    <line x1="8" y1="17" x2="12" y2="17" />
                  </svg>
                  <span className="sidebar-label">ข่าวฟุตบอล</span>
                </button>

                {/* Sidebar Leagues List Accordion (Only when football tab is active and expanded) */}
                {activeSidebarTab !== "feed" && !sidebarCollapsed && (
                  <div className="sidebar-leagues-panel">
                    <div className="sidebar-section-title">ลีกติดอันดับ</div>
                    <div className="sidebar-popular-list">
                      {POPULAR_LEAGUES_LIST.map((league) => (
                        <div
                          key={league.id}
                          className={`sidebar-league-item ${selectedLeagueId === String(league.id) ? "active" : ""}`}
                          onClick={() => handleLeagueSelect(league.id)}
                        >
                          <img
                            src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${league.id}.png`}
                            alt={league.name}
                            className="sidebar-league-logo"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                          <span className="sidebar-league-name">
                            {league.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="sidebar-section-title">ลีกทั้งหมด</div>
                    <div className="sidebar-search-wrapper">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="search-icon-svg"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder="ตัวกรอง..."
                        className="sidebar-search-input"
                        value={leagueFilter}
                        onChange={(e) => setLeagueFilter(e.target.value)}
                      />
                    </div>

                    {leaguesLoading ? (
                      <div className="sidebar-leagues-loading">
                        กำลังโหลดรายชื่อลีก...
                      </div>
                    ) : (
                      <div className="sidebar-leagues-scroll">
                        {/* International List */}
                        {filteredInternational.length > 0 && (
                          <div className="sidebar-country-group">
                            <div
                              className="sidebar-country-row"
                              onClick={() => toggleCountryExpand("INT")}
                            >
                              <div className="sidebar-country-left">
                                <img
                                  src="https://images.fotmob.com/image_resources/logo/teamlogo/int.png"
                                  alt="International"
                                  className="sidebar-country-flag"
                                />
                                <span className="sidebar-country-name">
                                  นานาชาติ
                                </span>
                              </div>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                className={`sidebar-chevron ${expandedCountries["INT"] ? "expanded" : ""}`}
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                            {expandedCountries["INT"] && (
                              <div className="sidebar-country-leagues">
                                {filteredInternational.map((league) => (
                                  <div
                                    key={league.id}
                                    className={`sidebar-league-subitem ${selectedLeagueId === String(league.id) ? "active" : ""}`}
                                    onClick={() =>
                                      handleLeagueSelect(league.id)
                                    }
                                  >
                                    <img
                                      src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${league.id}.png`}
                                      alt={league.name}
                                      className="subitem-logo"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                      }}
                                    />
                                    <span className="sidebar-league-name">
                                      {league.localizedName || league.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Country Groups */}
                        {filteredCountries.map((country) => {
                          const isExpanded = expandedCountries[country.ccode];
                          return (
                            <div
                              key={country.ccode}
                              className="sidebar-country-group"
                            >
                              <div
                                className="sidebar-country-row"
                                onClick={() =>
                                  toggleCountryExpand(country.ccode)
                                }
                              >
                                <div className="sidebar-country-left">
                                  <img
                                    src={`https://images.fotmob.com/image_resources/logo/teamlogo/${country.ccode.toLowerCase()}.png`}
                                    alt={country.name}
                                    className="sidebar-country-flag"
                                    onError={(e) => {
                                      e.target.src =
                                        "/images/football-default.png";
                                    }}
                                  />
                                  <span className="sidebar-country-name">
                                    {country.localizedName || country.name}
                                  </span>
                                </div>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  className={`sidebar-chevron ${isExpanded ? "expanded" : ""}`}
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </div>
                              {isExpanded && (
                                <div className="sidebar-country-leagues">
                                  {country.leagues.map((league) => (
                                    <div
                                      key={league.id}
                                      className={`sidebar-league-subitem ${selectedLeagueId === String(league.id) ? "active" : ""}`}
                                      onClick={() =>
                                        handleLeagueSelect(league.id)
                                      }
                                    >
                                      <img
                                        src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${league.id}.png`}
                                        alt={league.name}
                                        className="subitem-logo"
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                        }}
                                      />
                                      <span className="sidebar-league-name">
                                        {league.localizedName || league.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Column 2: Center Content Area */}
              <div className="homepage-main-content-column" ref={feedScrollRef}>
                {activeSidebarTab === "feed" ? (
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
                ) : (
                  <div className="homepage-football-column">
                    <FotMobWidget
                      hideTabs={hideTabs}
                      activeTab={activeSidebarTab}
                      leagueId={selectedLeagueId}
                      onLeagueChange={setSelectedLeagueId}
                      allLeagues={allLeagues}
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
