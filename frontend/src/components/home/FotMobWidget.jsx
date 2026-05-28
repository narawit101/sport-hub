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

const formatThaiFullDate = (d) => {
  const dayNames = [
    "วันอาทิตย์",
    "วันจันทร์",
    "วันอังคาร",
    "วันพุธ",
    "วันพฤหัสบดี",
    "วันศุกร์",
    "วันเสาร์",
  ];
  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const dayOfWeek = dayNames[d.day()];
  const dateNum = d.date();
  const monthName = monthNames[d.month()];

  return `${dayOfWeek}ที่ ${dateNum} ${monthName}`;
};

const getThaiDisplayDate = (d) => {
  const today = dayjs().startOf("day");
  const target = d.startOf("day");
  const diffDays = target.diff(today, "day");

  const fullDate = formatThaiFullDate(d);

  if (diffDays === 0) {
    return `วันนี้ - ${fullDate}`;
  } else if (diffDays === -1) {
    return `เมื่อวาน - ${fullDate}`;
  } else if (diffDays === 1) {
    return `พรุ่งนี้ - ${fullDate}`;
  } else {
    return fullDate;
  }
};

export default function FotMobWidget({
  hideTabs,
  activeTab: externalActiveTab,
  leagueId: externalLeagueId,
  onLeagueChange,
}) {
  const activeTab = externalActiveTab || "matches"; // feed / matches / standings / news

  const [internalLeagueId, setInternalLeagueId] = useState("47");
  const leagueId = externalLeagueId || internalLeagueId;
  const setLeagueId = onLeagueChange || setInternalLeagueId;

  const [date, setDate] = useState(dayjs());
  const [matches, setMatches] = useState([]);
  const [news, setNews] = useState([]);
  const [standings, setStandings] = useState([]);
  const [leagueName, setLeagueName] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [loading, setLoading] = useState(false);
  const [newsLoadingMore, setNewsLoadingMore] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [collapsedLeagues, setCollapsedLeagues] = useState({});

  const toggleLeague = (leagueId) => {
    setCollapsedLeagues((prev) => ({
      ...prev,
      [leagueId]: !prev[leagueId],
    }));
  };

  const handleLeagueChange = (newLeagueId) => {
    setLeagueId(newLeagueId);
    setSelectedSeason("");
  };

  const formatRelativeThaiTime = (gmtTimeStr) => {
    if (!gmtTimeStr) return "";
    const now = dayjs();
    const time = dayjs(gmtTimeStr);
    const diffMinutes = now.diff(time, "minute");

    if (diffMinutes < 1) return "เมื่อครู่";
    if (diffMinutes < 60) return `${diffMinutes} นาทีที่ผ่านมา`;

    const diffHours = now.diff(time, "hour");
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่ผ่านมา`;

    const diffDays = now.diff(time, "day");
    if (diffDays < 30) return `${diffDays} วันที่ผ่านมา`;

    const diffMonths = now.diff(time, "month");
    return `${diffMonths} เดือนที่ผ่านมา`;
  };

  const renderFormBadge = (match) => {
    const result = match.resultString;
    let bgClass = "";
    let text = "";

    if (result === "W") {
      bgClass = "win";
      text = "ชนะ";
    } else if (result === "D") {
      bgClass = "draw";
      text = "เสมอ";
    } else if (result === "L") {
      bgClass = "loss";
      text = "แพ้";
    } else {
      return null;
    }

    const isHome = match.home?.isOurTeam;

    return (
      <div
        className={`standings-form-badge ${bgClass} ${isHome ? "home-match" : "away-match"}`}
        key={match.linkToMatch}
        title={`${match.home.name} ${match.score} ${match.away.name}`}
      >
        <span className="badge-text">{text}</span>
        <span className="match-loc-line" />
      </div>
    );
  };

  // Fetch matches when date changes
  useEffect(() => {
    if (activeTab === "matches") {
      fetchMatches();
      setCollapsedLeagues({});
    }
  }, [date, activeTab]);

  // Fetch news
  useEffect(() => {
    if (activeTab === "news") {
      fetchNews();
    }
  }, [activeTab]);

  // Fetch standings when leagueId or selectedSeason changes
  useEffect(() => {
    if (activeTab === "standings") {
      fetchStandings();
    }
  }, [leagueId, selectedSeason, activeTab]);

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
      const res = await apiClient.get("/fotmob/news?startIndex=0");
      setNews(res.news || []);
    } catch (err) {
      console.error("Error fetching news:", err);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreNews = async () => {
    if (newsLoadingMore) return;
    setNewsLoadingMore(true);
    try {
      const res = await apiClient.get(`/fotmob/news?startIndex=${news.length}`);
      const newItems = res.news || [];
      setNews((prev) => [...prev, ...newItems]);
    } catch (err) {
      console.error("Error loading more news:", err);
    } finally {
      setNewsLoadingMore(false);
    }
  };

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const seasonParam = selectedSeason
        ? `&season=${encodeURIComponent(selectedSeason)}`
        : "";
      const res = await apiClient.get(
        `/fotmob/standings?leagueId=${leagueId}${seasonParam}`,
      );
      setStandings(res.standings || []);
      setSeasons(res.allAvailableSeasons || []);
      setLeagueName(res.leagueName || "");
    } catch (err) {
      console.error("Error fetching standings:", err);
      setStandings([]);
      setSeasons([]);
      setLeagueName("");
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
      return {
        text: status.liveTime ? `สด ${status.liveTime}'` : "สด",
        class: "live",
      };
    }
    return { text: status.startDateStr || "เร็วๆ นี้", class: "upcoming" };
  };

  return (
    <div className="football-widget-container">
      {/* Content Area */}
      {/* Matches Tab */}
      {activeTab === "matches" && (
        <div>
          <div className="football-date-selector">
            <button
              className="football-date-btn"
              onClick={() => adjustDate(-1)}
            >
              &lt;
            </button>
            <button
              className="football-date-display-btn"
              onClick={() => setShowCalendar(true)}
              aria-label="เลือกวันที่"
              style={{ minWidth: "220px" }}
            >
              {getThaiDisplayDate(date)}
            </button>
            <button className="football-date-btn" onClick={() => adjustDate(1)}>
              &gt;
            </button>
          </div>

          {showCalendar &&
            typeof document !== "undefined" &&
            document.body &&
            createPortal(
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
              </div>,
              document.body,
            )}

          {loading ? (
            <div className="football-loading-view">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="football-skeleton football-skeleton-card"
                />
              ))}
            </div>
          ) : matches.length === 0 ? (
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
              <h3 className="football-empty-title">
                ไม่มีโปรแกรมการแข่งขันยอดนิยมในวันนี้
              </h3>
              <p className="football-empty-description">
                ลองสลับดูวันอื่น หรือกลับมาตรวจสอบข้อมูลใหม่อีกครั้งภายหลังนะ
              </p>
            </div>
          ) : (
            <div className="football-matches-scroll-container">
              {matches.map((league) => (
                <div key={league.id} className="league-group">
                <div
                  className="league-header"
                  onClick={() => toggleLeague(league.id)}
                >
                  <div className="league-header-left">
                    <img
                      src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${league.id}.png`}
                      alt={league.name}
                      className="standings-team-logo"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <span>
                      {POPULAR_LEAGUE_NAMES[league.id] || league.name}
                    </span>
                  </div>
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
                    className={`league-chevron ${collapsedLeagues[league.id] ? "collapsed" : ""}`}
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </div>
                {!collapsedLeagues[league.id] && (
                  <div className="match-list">
                    {league.matches.map((match) => {
                      const status = getMatchStatusLabel(match.status);
                      const isFinished = match.status.finished;
                      const isCancelled = match.status.cancelled;
                      const isStarted = match.status.started;

                      let statusText = status.text;
                      if (isFinished) {
                        statusText = "FT";
                      } else if (isCancelled) {
                        statusText = "CAN";
                      }

                      return (
                        <div key={match.id} className="match-card">
                          {/* Left side: Status badge */}
                          <div className="match-status-col">
                            <span
                              className={`match-status-badge-flat ${status.class}`}
                            >
                              {statusText}
                            </span>
                          </div>

                          {/* Center: Teams and Score */}
                          <div className="match-teams-score-col">
                            <div className="match-team-home-flat">
                              <span className="team-name-flat">
                                {match.home.name}
                              </span>
                              <img
                                src={`https://images.fotmob.com/image_resources/logo/teamlogo/${match.home.id}.png`}
                                alt={match.home.name}
                                className="team-logo-flat"
                                onError={(e) => {
                                  e.target.src = "/images/football-default.png";
                                }}
                              />
                            </div>
                            <div className="match-score-flat">
                              {isStarted || isFinished
                                ? `${match.home.score} - ${match.away.score}`
                                : "VS"}
                            </div>
                            <div className="match-team-away-flat">
                              <img
                                src={`https://images.fotmob.com/image_resources/logo/teamlogo/${match.away.id}.png`}
                                alt={match.away.name}
                                className="team-logo-flat"
                                onError={(e) => {
                                  e.target.src = "/images/football-default.png";
                                }}
                              />
                              <span className="team-name-flat">
                                {match.away.name}
                              </span>
                            </div>
                          </div>

                          {/* Right side: spacer col */}
                          <div className="match-spacer-col"></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      {/* Standings Tab */}
      {activeTab === "standings" && (
        <div>
          {/* League & Season Selectors */}
          <div className="standings-header-section">
            <span style={{ fontWeight: 800, color: "var(--text-color)" }}>
              ตารางคะแนน {leagueName || POPULAR_LEAGUE_NAMES[leagueId] || ""}
            </span>
            <div className="standings-selectors-wrapper">
              {seasons.length > 0 && (
                <select
                  className="standings-season-select"
                  value={selectedSeason}
                  onChange={(e) => {
                    setSelectedSeason(e.target.value);
                  }}
                >
                  <option value="">ฤดูกาลปัจจุบัน</option>
                  {seasons.map((seasonStr) => (
                    <option key={seasonStr} value={seasonStr}>
                      {seasonStr}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {loading ? (
            <div className="football-loading-view">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="football-skeleton football-skeleton-card"
                />
              ))}
            </div>
          ) : standings.length === 0 ? (
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
                ขณะนี้ไม่สามารถดึงข้อมูลตารางคะแนนของลีกที่เลือกได้
                ลองกลับมาดูอีกครั้งนะ
              </p>
            </div>
          ) : (
            <div className="standings-table-container">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th style={{ width: "60px", textAlign: "center" }}>#</th>
                    <th style={{ textAlign: "left" }}>สโมสร</th>
                    <th style={{ width: "55px", textAlign: "center" }}>แข่ง</th>
                    <th style={{ width: "55px", textAlign: "center" }}>ชนะ</th>
                    <th style={{ width: "55px", textAlign: "center" }}>เสมอ</th>
                    <th style={{ width: "55px", textAlign: "center" }}>แพ้</th>
                    <th style={{ width: "75px", textAlign: "center" }}>+/-</th>
                    <th style={{ width: "55px", textAlign: "center" }}>=</th>
                    <th style={{ width: "65px", textAlign: "center" }}>
                      คะแนน
                    </th>
                    <th style={{ width: "195px", textAlign: "left" }}>ฟอร์ม</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team) => (
                    <tr
                      key={team.id}
                      className={team.idx <= 4 ? "top-team" : ""}
                    >
                      <td
                        className="standings-rank-cell"
                        style={{
                          borderLeft: team.qualColor
                            ? `4px solid ${team.qualColor}`
                            : "4px solid transparent",
                        }}
                      >
                        {team.idx}
                      </td>
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
                      <td style={{ textAlign: "center" }}>{team.wins}</td>
                      <td style={{ textAlign: "center" }}>{team.draws}</td>
                      <td style={{ textAlign: "center" }}>{team.losses}</td>
                      <td style={{ textAlign: "center", color: "#64748b" }}>
                        {team.scoresStr || "-"}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: 700,
                          color:
                            team.goalConDiff > 0
                              ? "#10b981"
                              : team.goalConDiff < 0
                                ? "#ef4444"
                                : "#64748b",
                        }}
                      >
                        {team.goalConDiff > 0
                          ? `+${team.goalConDiff}`
                          : team.goalConDiff}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: 800,
                          color: "var(--text-color)",
                        }}
                      >
                        {team.pts}
                      </td>
                      <td>
                        <div className="standings-form-row">
                          {team.form && team.form.length > 0 ? (
                            team.form
                              .slice(-5)
                              .map((match) => renderFormBadge(match))
                          ) : (
                            <span
                              style={{ color: "#94a3b8", fontSize: "12px" }}
                            >
                              -
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Standings Qualification Legend */}
              <div className="standings-legend-container">
                <div className="standings-legend-item">
                  <span className="legend-dot cl-dot" />
                  <span className="legend-text">แชมเปียนส์ลีก</span>
                </div>
                <div className="standings-legend-item">
                  <span className="legend-dot el-dot" />
                  <span className="legend-text">ยูโรปาลีก</span>
                </div>
                <div className="standings-legend-item">
                  <span className="legend-dot ecl-dot" />
                  <span className="legend-text">
                    รอบคัดเลือกยูโรปาคอนเฟอเรนซ์ลีก
                  </span>
                </div>
                <div className="standings-legend-item">
                  <span className="legend-dot rel-dot" />
                  <span className="legend-text">การตกชั้น</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* News Tab */}
      {activeTab === "news" && (
        <div className="football-news-list">
          {loading ? (
            <div className="football-loading-view">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="football-skeleton football-skeleton-news"
                />
              ))}
            </div>
          ) : news.length === 0 ? (
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
              <h3 className="football-empty-title">
                ไม่มีข่าวสารล่าสุดในขณะนี้
              </h3>
              <p className="football-empty-description">
                ขณะนี้ไม่มีหัวข้อข่าวกีฬาฟุตบอลต่างประเทศอัปเดต
                ลองกลับมาอ่านอีกครั้งในภายหลังนะ
              </p>
            </div>
          ) : (
            <div className="news-content-wrapper">
              {news.length >= 5 ? (
                <>
                  {/* Featured Top Section */}
                  <div className="football-news-featured-wrapper">
                    {/* Left featured card */}
                    <a
                      href={news[0].pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="news-featured-big"
                    >
                      {news[0].imageUrl && (
                        <img
                          src={news[0].imageUrl}
                          alt={news[0].title}
                          className="news-featured-big-img"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      <div className="news-featured-big-overlay">
                        <div className="news-featured-big-header">
                          {/* <img
                            src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${leagueId}.png`}
                            alt="League Logo"
                            className="news-featured-league-logo"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          /> */}
                          {/* <span className="news-featured-league-name">
                            {POPULAR_LEAGUE_NAMES[leagueId] || "ข่าวกีฬาฟุตบอล"}
                          </span> */}
                        </div>
                        <h3 className="news-featured-big-title">
                          {news[0].title}
                        </h3>
                        <div className="news-featured-big-meta">
                          <span className="news-featured-source-badge">
                            {news[0].source}
                          </span>
                          <span className="news-featured-time">
                            {formatRelativeThaiTime(news[0].time)}
                          </span>
                        </div>
                      </div>
                    </a>

                    {/* Right column list */}
                    <div className="news-featured-list">
                      {news.slice(1, 5).map((item, idx) => (
                        <a
                          key={item.id || idx}
                          href={item.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="news-featured-list-item"
                        >
                          <div className="news-featured-list-item-content">
                            <h4 className="news-featured-list-item-title">
                              {item.title}
                            </h4>
                            <div className="news-featured-list-item-meta">
                              <span className="news-source">{item.source}</span>
                              <span className="news-time">
                                {formatRelativeThaiTime(item.time)}
                              </span>
                            </div>
                          </div>
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="news-featured-list-item-thumb"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          )}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* 2-Column Grid for remaining news items (5 onwards) */}
                  {news.length > 5 && (
                    <div className="football-news-grid">
                      {news.slice(5).map((item, idx) => (
                        <a
                          key={item.id || idx}
                          href={item.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="football-news-card-grid"
                        >
                          <div className="football-news-card-grid-content">
                            <h4 className="football-news-card-grid-title">
                              {item.title}
                            </h4>
                            <div className="football-news-card-grid-meta">
                              <span className="news-source">{item.source}</span>
                              <span className="news-time">
                                {formatRelativeThaiTime(item.time)}
                              </span>
                            </div>
                          </div>
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="football-news-card-grid-thumb"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Standard List Fallback */
                <div className="football-news-list-legacy">
                  {news.map((item, idx) => (
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
                          <span className="football-news-source">
                            {item.source}
                          </span>
                          <span>{formatRelativeThaiTime(item.time)}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Pagination Load More Button */}
              <div className="news-load-more-container">
                <button
                  className="btn-load-more-news"
                  onClick={loadMoreNews}
                  disabled={newsLoadingMore}
                >
                  {newsLoadingMore ? "กำลังโหลดข่าว..." : "ดูข่าวเพิ่มเติม ↗"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
