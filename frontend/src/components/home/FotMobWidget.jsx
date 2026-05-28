"use client";
import { useState, useEffect } from "react";
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
          className="football-header-icon"
        >
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 6v12" />
          <path d="M6 12h12" />
        </svg>
        <h2 className="football-widget-title">ข่าวกีฬา & ผลบอลสด</h2>
      </div>

      {/* Header Tabs */}
      <div className="football-tabs">
        <button
          className={`football-tab-btn ${activeTab === "matches" ? "active" : ""}`}
          onClick={() => setActiveTab("matches")}
        >
          ตารางและผลบอล
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
          {/* Matches Tab */}
          {activeTab === "matches" && (
            <div>
              {/* Date Switcher */}
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

              {showCalendar && (
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
              )}

              {matches.length === 0 ? (
                <div className="football-empty-view">ไม่มีโปรแกรมการแข่งขันยอดนิยมในวันนี้</div>
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
                <div className="football-empty-view">ไม่มีข้อมูลตารางคะแนน</div>
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
                <div className="football-empty-view">ไม่มีข่าวสารล่าสุดในขณะนี้</div>
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
