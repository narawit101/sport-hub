const express = require("express");
const router = express.Router();
const { getCache, setCache } = require("../config/cache");
const { enrichLeagueCountry } = require("../utils/fotmobCountryResolver");

// Local in-memory cache fallback for local development (no Redis)
const memoryCache = new Map();

async function getCachedData(key) {
  const redisVal = await getCache(key);
  if (redisVal) return redisVal;

  const cached = memoryCache.get(key);
  if (cached) {
    if (Date.now() < cached.expireAt) {
      return cached.value;
    }
    memoryCache.delete(key);
  }
  return null;
}

async function setCachedData(key, value, ttlSeconds) {
  await setCache(key, value, ttlSeconds);
  memoryCache.set(key, {
    value,
    expireAt: Date.now() + ttlSeconds * 1000,
  });
}

async function fetchFromFotmob(url) {
  return fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
      "Referer": "https://www.fotmob.com/",
      "Origin": "https://www.fotmob.com",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    }
  });
}

async function fetchAllLeagues() {
  const cacheKey = "fotmob:all-leagues:v3";
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  const response = await fetchFromFotmob("https://www.fotmob.com/api/data/allLeagues?locale=th");
  if (!response.ok) throw new Error(`Status: ${response.status}`);

  const data = await response.json();
  await setCachedData(cacheKey, data, 86400);
  return data;
}

function getGroupedLeagueName(name) {
  return String(name || "")
    .replace(/\s+Grp\.\s+[A-Z0-9]+$/i, "")
    .trim();
}

function getMatchStageName(name) {
  const match = String(name || "").match(/\s+Grp\.\s+([A-Z0-9]+)$/i);
  return match ? `กลุ่ม ${match[1].toUpperCase()}` : null;
}

function getLeagueStageName(tournamentStage) {
  const stage = String(tournamentStage || "").toLowerCase();
  if (stage === "final") return "รอบตัดสิน";
  if (stage === "semifinal" || stage === "semi-final") return "รอบรองชนะเลิศ";
  if (stage === "quarterfinal" || stage === "quarter-final") return "รอบก่อนรองชนะเลิศ";
  if (stage === "roundof16" || stage === "round-of-16") return "รอบ 16 ทีม";

  return null;
}

function buildLeagueNameLookup(allLeagues) {
  const byId = new Map();

  for (const group of allLeagues?.international || []) {
    for (const league of group.leagues || []) {
      byId.set(String(league.id), league.localizedName || league.name);
    }
  }

  for (const country of allLeagues?.countries || []) {
    for (const league of country.leagues || []) {
      byId.set(String(league.id), league.localizedName || league.name);
    }
  }

  return byId;
}

function shouldGroupLeague(league) {
  return Boolean(
    league?.parentLeagueId &&
    league?.primaryId &&
    league.parentLeagueId === league.primaryId &&
    /\sGrp\.\s+[A-Z0-9]+$/i.test(league.originalName || league.name || "")
  );
}

function groupMatchLeagues(leagues) {
  const grouped = [];
  const parentIndex = new Map();

  for (const league of leagues) {
    if (!shouldGroupLeague(league)) {
      grouped.push(league);
      continue;
    }

    const key = `${league.ccode || ""}:${league.parentLeagueId}`;
    const existingIndex = parentIndex.get(key);

    if (existingIndex === undefined) {
      parentIndex.set(key, grouped.length);
      grouped.push({
        ...league,
        id: league.parentLeagueId,
        logoId: league.parentLeagueId,
        name: league.parentLeagueName || getGroupedLeagueName(league.originalName || league.name),
        childLeagueIds: [league.id],
      });
      continue;
    }

    grouped[existingIndex] = {
      ...grouped[existingIndex],
      matches: grouped[existingIndex].matches.concat(league.matches),
      childLeagueIds: grouped[existingIndex].childLeagueIds.concat(league.id),
    };
  }

  return grouped;
}

// 1. Football News Endpoint (Updated with tlnews and pagination)
router.get("/news", async (req, res) => {
  const startIndex = parseInt(req.query.startIndex || "0", 10);
  const limit = startIndex === 0 ? 25 : 20;
  const cacheKey = `fotmob:news:v6:${startIndex}`;
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) return res.status(200).json(cached);

    let rawNews = [];
    if (startIndex === 0) {
      // Fetch both page 1 and page 2 concurrently to obtain enough items for 25
      const [res1, res2] = await Promise.all([
        fetchFromFotmob("https://www.fotmob.com/api/data/tlnews?id=47&type=league&language=th&startIndex=0"),
        fetchFromFotmob("https://www.fotmob.com/api/data/tlnews?id=47&type=league&language=th&startIndex=20")
      ]);

      if (res1.ok) {
        const json1 = await res1.json();
        rawNews = rawNews.concat(json1.data || []);
      }
      if (res2.ok) {
        const json2 = await res2.json();
        rawNews = rawNews.concat(json2.data || []);
      }

      if (!res1.ok && rawNews.length === 0) {
        // Fallback to worldnews if both fail or if page 1 fails
        const fbResponse = await fetchFromFotmob("https://www.fotmob.com/api/worldnews?page=1");
        const fbData = await fbResponse.json();
        const newsItems = (fbData || []).map(item => ({
          id: item.id,
          title: item.title || item.heading,
          imageUrl: item.imageUrl || (item.mainImage ? item.mainImage.url : null),
          source: item.sourceName || item.sourceStr || "FotMob",
          time: item.time || item.gmtTime || "",
          pageUrl: (item.pageUrl || (item.page ? item.page.url : "")).startsWith("http")
            ? (item.pageUrl || item.page.url)
            : `https://www.fotmob.com${item.pageUrl || item.page.url}`,
        })).slice(0, limit);

        const result = { news: newsItems };
        await setCachedData(cacheKey, result, 3600);
        return res.status(200).json(result);
      }
    } else {
      const response = await fetchFromFotmob(`https://www.fotmob.com/api/data/tlnews?id=47&type=league&language=th&startIndex=${startIndex}`);
      if (!response.ok) {
        // Fallback to worldnews
        const pageNum = Math.floor(startIndex / 20) + 1;
        const fbResponse = await fetchFromFotmob(`https://www.fotmob.com/api/worldnews?page=${pageNum}`);
        const fbData = await fbResponse.json();
        const newsItems = (fbData || []).map(item => ({
          id: item.id,
          title: item.title || item.heading,
          imageUrl: item.imageUrl || (item.mainImage ? item.mainImage.url : null),
          source: item.sourceName || item.sourceStr || "FotMob",
          time: item.time || item.gmtTime || "",
          pageUrl: (item.pageUrl || (item.page ? item.page.url : "")).startsWith("http")
            ? (item.pageUrl || item.page.url)
            : `https://www.fotmob.com${item.pageUrl || item.page.url}`,
        })).slice(0, limit);

        const result = { news: newsItems };
        await setCachedData(cacheKey, result, 3600);
        return res.status(200).json(result);
      }
      const json = await response.json();
      rawNews = json.data || [];
    }

    const newsItems = rawNews.map(item => ({
      id: item.id,
      title: item.title,
      imageUrl: item.imageUrl,
      source: item.sourceStr || "FotMob",
      time: item.gmtTime || "",
      pageUrl: item.page.url.startsWith("http") ? item.page.url : `https://www.fotmob.com${item.page.url}`,
    }));

    const result = { news: newsItems.slice(0, limit) };
    await setCachedData(cacheKey, result, 3600);

    res.status(200).json(result);
  } catch (error) {
    console.error("[FotMob News Error]:", error.message);
    res.status(500).json({ message: "Failed to fetch football news" });
  }
});

// 2. Football Matches Endpoint
router.get("/matches", async (req, res) => {
  const date = req.query.date;
  if (!date) return res.status(400).json({ message: "Date parameter is required" });

  const cacheKey = `fotmob:matches:v15:${date}`;
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) return res.status(200).json(cached);

    // Using the new data/matches endpoint discovered
    const [response, allLeagues] = await Promise.all([
      fetchFromFotmob(`https://www.fotmob.com/api/data/matches?date=${date}&timezone=Asia/Bangkok&ccode3=THA&includeNextDayLateNight=true`),
      fetchAllLeagues().catch((error) => {
        console.warn("[FotMob Countries Warning]:", error.message);
        return null;
      }),
    ]);
    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const data = await response.json();
    const leagues = data.leagues || [];
    const filteredLeagues = [];
    const leagueNameLookup = buildLeagueNameLookup(allLeagues);

    leagues.forEach(league => {
      const leagueStageName = getLeagueStageName(
        league.matches?.[0]?.tournamentStage,
      );
      const matches = (league.matches || []).map(match => {
        let isNextDayLateNight = false;
        const timeTs = match.status?.utcTime ? new Date(match.status.utcTime).getTime() : match.timeTS;
        if (timeTs) {
          const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Bangkok",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          const parts = formatter.formatToParts(new Date(timeTs));
          const m = parts.find(p => p.type === 'month').value;
          const d = parts.find(p => p.type === 'day').value;
          const y = parts.find(p => p.type === 'year').value;
          const matchDateStr = `${y}${m}${d}`;
          isNextDayLateNight = (matchDateStr > date);
        }

        return {
        id: match.id,
        isNextDayLateNight,
        stageName: getMatchStageName(league.name),
        home: { 
          id: match.home.id, 
          name: match.home.name, 
          score: match.home.score,
          redCards: match.home.redCards,
          penScore: match.home.penScore
        },
        away: { 
          id: match.away.id, 
          name: match.away.name, 
          score: match.away.score,
          redCards: match.away.redCards,
          penScore: match.away.penScore
        },
        status: {
          finished: match.status?.finished || false,
          started: match.status?.started || false,
          cancelled: match.status?.cancelled || false,
          liveTime: match.status?.liveTime || null,
          scoreStr: match.status?.scoreStr || null,
          reason: match.status?.reason || null,
          utcTime: match.status?.utcTime || null,
          timeTS: match.timeTS || null,
          startDateStr: match.status?.startDateStr || match.time || "",
          aggregatedStr: match.status?.aggregatedStr || null,
        }
      };
    });

      if (matches.length > 0) {
        filteredLeagues.push(enrichLeagueCountry({
          id: league.id,
          primaryId: league.primaryId,
          parentLeagueId: league.parentLeagueId,
          logoId: league.parentLeagueId || league.primaryId || league.id,
          originalName: league.name,
          name: league.parentLeagueId
            ? leagueNameLookup.get(String(league.parentLeagueId)) || league.name
            : leagueNameLookup.get(String(league.id)) || league.name,
          parentLeagueName: league.parentLeagueId
            ? leagueNameLookup.get(String(league.parentLeagueId))
            : null,
          leagueStageName,
          ccode: league.ccode,
          internalRank: league.internalRank,
          liveRank: league.liveRank,
          localRank: league.localRank,
          matches
        }, allLeagues));
      }
    });

    const groupedLeagues = groupMatchLeagues(filteredLeagues);
    groupedLeagues.sort((a, b) => {
      const rankA = a.localRank !== undefined ? a.localRank : 99999;
      const rankB = b.localRank !== undefined ? b.localRank : 99999;
      return rankA - rankB;
    });

    groupedLeagues.forEach(league => {
      if (league.matches && league.matches.length > 0) {
        league.matches.sort((a, b) => {
          if (a.isNextDayLateNight !== b.isNextDayLateNight) {
            return a.isNextDayLateNight ? 1 : -1;
          }
          const timeA = a.status?.utcTime ? new Date(a.status.utcTime).getTime() : (a.status?.timeTS || 0);
          const timeB = b.status?.utcTime ? new Date(b.status.utcTime).getTime() : (b.status?.timeTS || 0);
          return timeA - timeB;
        });
      }
    });

    const result = { leagues: groupedLeagues };
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const ttl = (date === todayStr) ? 120 : 3600;

    await setCachedData(cacheKey, result, ttl);
    res.status(200).json(result);
  } catch (error) {
    console.error("[FotMob Matches Error]:", error.message);
    res.status(500).json({ message: "Failed to fetch matches" });
  }
});

// 3. League Standings Endpoint (Updated to use data/leagues and include seasons)
router.get("/standings", async (req, res) => {
  const leagueId = req.query.leagueId || "47";
  const season = req.query.season || "";
  const cacheKey = `fotmob:standings:v5:${leagueId}:${season || "current"}`;

  try {
    const cached = await getCachedData(cacheKey);
    if (cached) return res.status(200).json(cached);

    let url = `https://www.fotmob.com/api/data/leagues?id=${leagueId}&ccode3=THA`;
    if (season) {
      url += `&season=${encodeURIComponent(season)}`;
    }

    const response = await fetchFromFotmob(url);
    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const data = await response.json();

    const tableObj = data.overview?.table?.[0] || data.table?.[0];
    let tablesResult = [];

    if (tableObj) {
      const teamForm = tableObj.teamForm || {};

      const processTable = (rawTable) => {
        return rawTable.map(team => ({
          idx: team.idx,
          id: team.id,
          name: team.name,
          played: team.played,
          wins: team.wins,
          draws: team.draws,
          losses: team.losses,
          pts: team.pts,
          goalConDiff: team.goalConDiff,
          scoresStr: team.scoresStr,
          qualColor: team.qualColor,
          form: teamForm[team.id] || []
        }));
      };

      // Handle composite table structures (multiple zones/groups)
      if (tableObj.data?.tables) {
        tableObj.data.tables.forEach(tGroup => {
          const rawTable = tGroup.table?.all || [];
          tablesResult.push({
            groupName: tGroup.leagueName || "",
            standings: processTable(rawTable),
            legend: tGroup.legend || []
          });
        });
      } else if (tableObj.data?.table?.all) {
        const rawTable = tableObj.data.table.all;
        const legendArr = tableObj.data.legend || [];
        tablesResult.push({
          groupName: "",
          standings: processTable(rawTable),
          legend: legendArr
        });
      } else if (tableObj.table?.all) {
        const rawTable = tableObj.table.all;
        const legendArr = tableObj.legend || [];
        tablesResult.push({
          groupName: "",
          standings: processTable(rawTable),
          legend: legendArr
        });
      }
    }

    const result = {
      tables: tablesResult,
      allAvailableSeasons: data.allAvailableSeasons || [],
      leagueName: data.details?.name || data.overview?.leagueName || data.table?.[0]?.leagueName || ""
    };
    await setCachedData(cacheKey, result, 3600);

    res.status(200).json(result);
  } catch (error) {
    console.error("[FotMob Standings Error]:", error.message);
    res.status(500).json({ message: "Failed to fetch standings" });
  }
});

// 4. Get all leagues and countries grouped list
router.get("/all-leagues", async (req, res) => {
  try {
    const data = await fetchAllLeagues();
    res.status(200).json(data);
  } catch (error) {
    console.error("[FotMob All Leagues Error]:", error.message);
    res.status(500).json({ message: "Failed to fetch all leagues list" });
  }
});

module.exports = router;
