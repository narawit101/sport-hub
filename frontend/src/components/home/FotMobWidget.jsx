"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import apiClient from "@/lib/apiClient";
import Calendar from "react-calendar";
import "@/app/css/football-styles.css";
import "@/app/css/calendar-styles.css";

const POPULAR_LEAGUE_NAMES = {
  47: "English Premier League",
  339: "Thai League 1",
  87: "La Liga",
  54: "Bundesliga",
  55: "Serie A",
  53: "Ligue 1",
  42: "Champions League",
  73: "Europa League",
};

export default function FotMobWidget() {
  const [activeTab, setActiveTab] = useState("matches"); // matches | standings | news
  const [date, setDate] = useState(dayjs());
  const [matches, setMatches] = useState([]);
  const [news, setNews] = useState([]);
  const [standings, setStandings] = useState([]);
  const [leagueId, setLeagueId] = useState("47"); // Default EPL (47)
  const [loading, setLoading] = useState(false);
  const [showAllStandings, setShowAllStandings] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch matches when date changes
  useEffect(() => {
    if (activeTab === "matches") {
      fetchMatches();
    }
  }, [date, activeTab]);

  // Fetch news
  useEffect(() => {
    if (activeTab === "news") {
      fetchNews();
    }
  }, [activeTab]);

  // Fetch standings when leagueId changes
  useEffect(() => {
    if (activeTab === "standings") {
      fetchStandings();
    }
  }, [leagueId, activeTab]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const formattedDate = date.format("YYYYMMDD");
      const res = await apiClient.get(`/fotmob/matches?date=${formattedDate}`);
      setMatches(res.leagues || []);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/fotmob/news");
      setNews(res.news || []);
    } catch (err) {
      console.error("Error fetching news:", err);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/fotmob/standings?leagueId=${leagueId}`);
      setStandings(res.standings || []);
    } catch (err) {
      console.error("Error fetching standings:", err);
      setStandings([]);
    } finally {
      setLoading(false);
    }
  };

  const adjustDate = (days) => {
    setDate((prev) => prev.add(days, "day"));
  };

  const getMatchStatusLabel = (status) => {
    if (status.cancelled) return { text: "ยกเลิก", class: "finished" };
    if (status.finished) return { text: "จบการแข่งขัน", class: "finished" };
    if (status.started) {
      return { text: status.liveTime ? `สด ${status.liveTime}'` : "สด", class: "live" };
    }
    // Convert UTC/Start time to Local Time if needed, or return original string
    return { text: status.startDateStr || "เร็วๆ นี้", class: "upcoming" };
  };

  return (
    <div className="football-widget-container">
      {/* Widget Header */}
      <div className="football-widget-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10s10-4.49 10-10S17.51 2 12 2m6.23 15H16l-1.25 2.5c-.86.32-1.78.5-2.75.5s-1.89-.18-2.75-.5L8 17H5.77a8 8 0 0 1-1.63-3.53L6 10.99L4.78 8.56a8.02 8.02 0 0 1 4.79-4.19L12 5.99l2.43-1.62c2.11.68 3.84 2.21 4.79 4.19L18 11l1.86 2.48A8.1 8.1 0 0 1 18.24 17Z"></path>
          <path fill="currentColor" d="m8.5 11l1.5 4h4l1.5-4L12 8.5z"></path>
        </svg>
        <h2 className="football-widget-title">ข่าวกีฬา & ผลบอลสด</h2>
      </div>

      {/* Header Tabs */}
      <div className="football-tabs">
        <button
          className={`football-tab-btn ${activeTab === "matches" ? "active" : ""}`}
          onClick={() => setActiveTab("matches")}
        >
          ผลบอล
        </button>
        <button
          className={`football-tab-btn ${activeTab === "standings" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("standings");
            setShowAllStandings(false);
          }}
        >
          ตารางคะแนน
        </button>
        <button
          className={`football-tab-btn ${activeTab === "news" ? "active" : ""}`}
          onClick={() => setActiveTab("news")}
        >
          ข่าวฟุตบอลต่างประเทศ
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="football-loading-view">
          {activeTab === "news" ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="football-skeleton football-skeleton-news" />
            ))
          ) : (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="football-skeleton football-skeleton-card" />
            ))
          )}
        </div>

      ) : (
        <>
          <div className="football-date-selector">
            <button className="football-date-btn" onClick={() => adjustDate(-1)}>
              &lt;
            </button>
            <button
              className="football-date-display-btn"
              onClick={() => setShowCalendar(true)}
              aria-label="เลือกวันที่"
            >
              {date.isSame(dayjs(), "day")
                ? "วันนี้"
                : date.format("D MMM YYYY")}
            </button>
            <button className="football-date-btn" onClick={() => adjustDate(1)}>
              &gt;
            </button>
          </div>
          {/* Matches Tab */}
          {activeTab === "matches" && (
            <div>
              {/* Date Switcher */}


              {showCalendar && typeof document !== 'undefined' && document.body && createPortal(
                <div
                  className="calendar-popup-overlay"
                  onClick={() => setShowCalendar(false)}
                >
                  <div
                    className="calendar-popup"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="btn-close-calendar-premium"
                      onClick={() => setShowCalendar(false)}
                      aria-label="ปิดปฏิทิน"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <Calendar
                      locale="th-TH"
                      onChange={(selectedDate) => {
                        setDate(dayjs(selectedDate));
                        setShowCalendar(false);
                      }}
                      value={date.toDate()}
                      showNeighboringMonth={false}
                    />
                  </div>
                </div>
                , document.body)}

              {matches.length === 0 ? (
                <div className="football-empty-container">
                  <div className="football-empty-icon-wrapper">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <path d="M8 14h.01" />
                      <path d="M12 14h.01" />
                      <path d="M16 14h.01" />
                      <path d="M8 18h.01" />
                      <path d="M12 18h.01" />
                      <path d="M16 18h.01" />
                    </svg>
                  </div>
                  <h3 className="football-empty-title">ไม่มีโปรแกรมการแข่งขันยอดนิยมในวันนี้</h3>
                  <p className="football-empty-description">
                    ลองสลับดูวันอื่น หรือกลับมาตรวจสอบข้อมูลใหม่อีกครั้งภายหลังนะ
                  </p>
                </div>
              ) : (
                matches.map((league) => (
                  <div key={league.id} className="league-group">
                    <div className="league-header">
                      <img
                        src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${league.id}.png`}
                        alt={league.name}
                        className="standings-team-logo"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <span>{POPULAR_LEAGUE_NAMES[league.id] || league.name}</span>
                    </div>
                    <div className="match-list">
                      {league.matches.map((match) => {
                        const status = getMatchStatusLabel(match.status);
                        return (
                          <div key={match.id} className="match-card">
                            {/* Home Team */}
                            <div className="match-team home">
                              <span>{match.home.name}</span>
                              <img
                                src={`https://images.fotmob.com/image_resources/logo/teamlogo/${match.home.id}.png`}
                                alt={match.home.name}
                                className="match-team-logo"
                                onError={(e) => {
                                  e.target.src = "/images/football-default.png";
                                }}
                              />
                            </div>

                            {/* Center Score / Status */}
                            <div className="match-info-center">
                              <div className="match-score">
                                {match.status.started || match.status.finished
                                  ? `${match.home.score} - ${match.away.score}`
                                  : "VS"}
                              </div>
                              <span className={`match-status-badge ${status.class}`}>
                                {status.text}
                              </span>
                            </div>

                            {/* Away Team */}
                            <div className="match-team away">
                              <img
                                src={`https://images.fotmob.com/image_resources/logo/teamlogo/${match.away.id}.png`}
                                alt={match.away.name}
                                className="match-team-logo"
                                onError={(e) => {
                                  e.target.src = "/images/football-default.png";
                                }}
                              />
                              <span>{match.away.name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Standings Tab */}
          {activeTab === "standings" && (
            <div>
              {/* League Selector */}
              <div className="standings-header-section">
                <span style={{ fontWeight: 800, color: "var(--text-color)" }}>ลีกยอดนิยม</span>
                <select
                  className="standings-league-select"
                  value={leagueId}
                  onChange={(e) => {
                    setLeagueId(e.target.value);
                    setShowAllStandings(false);
                  }}
                >
                  <option value="47">English Premier League</option>
                  <option value="339">Thai League 1</option>
                  <option value="87">La Liga</option>
                  <option value="54">Bundesliga</option>
                  <option value="55">Serie A</option>
                  <option value="53">Ligue 1</option>
                </select>
              </div>

              {standings.length === 0 ? (
                <div className="football-empty-container">
                  <div className="football-empty-icon-wrapper">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <h3 className="football-empty-title">ไม่มีข้อมูลตารางคะแนน</h3>
                  <p className="football-empty-description">
                    ขณะนี้ไม่สามารถดึงข้อมูลตารางคะแนนของลีกที่เลือกได้ ลองกลับมาดูอีกครั้งนะ
                  </p>
                </div>
              ) : (
                <div className="standings-table-container">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th style={{ width: "50px", textAlign: "center" }}>อันดับ</th>
                        <th>สโมสร</th>
                        <th style={{ width: "50px", textAlign: "center" }}>แข่ง</th>
                        <th style={{ width: "50px", textAlign: "center" }}>ได้/เสีย</th>
                        <th style={{ width: "60px", textAlign: "center" }}>แต้ม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showAllStandings ? standings : standings.slice(0, 8)).map((team) => (
                        <tr key={team.id} className={team.idx <= 4 ? "top-team" : ""}>
                          <td style={{ textAlign: "center", fontWeight: 700 }}>{team.idx}</td>
                          <td>
                            <div className="standings-team-cell">
                              <img
                                src={`https://images.fotmob.com/image_resources/logo/teamlogo/${team.id}.png`}
                                alt={team.name}
                                className="standings-team-logo"
                                onError={(e) => {
                                  e.target.src = "/images/football-default.png";
                                }}
                              />
                              <span>{team.name}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "center" }}>{team.played}</td>
                          <td style={{ textAlign: "center", color: "#64748b" }}>
                            {Array.isArray(team.goalConDiff)
                              ? `${team.goalConDiff[0] || 0}-${team.goalConDiff[1] || 0}`
                              : team.goalConDiff}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 800, color: "var(--text-color)" }}>
                            {team.pts}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    className="standings-toggle-btn"
                    onClick={() => setShowAllStandings(!showAllStandings)}
                  >
                    {showAllStandings ? "แสดงน้อยลง" : "ดูอันดับทั้งหมด"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* News Tab */}
          {activeTab === "news" && (
            <div className="football-news-list">
              {news.length === 0 ? (
                <div className="football-empty-container">
                  <div className="football-empty-icon-wrapper">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <path d="M16 8h2" />
                      <path d="M16 12h2" />
                      <path d="M16 16h2" />
                      <path d="M6 8h6v8H6z" />
                    </svg>
                  </div>
                  <h3 className="football-empty-title">ไม่มีข่าวสารล่าสุดในขณะนี้</h3>
                  <p className="football-empty-description">
                    ขณะนี้ไม่มีหัวข้อข่าวกีฬาฟุตบอลต่างประเทศอัปเดต ลองกลับมาอ่านอีกครั้งในภายหลังนะ
                  </p>
                </div>
              ) : (
                news.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="football-news-card"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="football-news-thumb"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <div className="football-news-content">
                      <h3 className="football-news-title">{item.title}</h3>
                      <div className="football-news-meta">
                        <span className="football-news-source">{item.source}</span>
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
