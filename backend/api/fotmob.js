const express = require("express");
const router = express.Router();
const { getCache, setCache } = require("../config/cache");

// Local in-memory cache fallback for local development (no Redis)
const memoryCache = new Map();

async function getCachedData(key) {
  // 1. Try Redis first
  const redisVal = await getCache(key);
  if (redisVal) return redisVal;

  // 2. Try in-memory fallback
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
  // 1. Set to Redis
  await setCache(key, value, ttlSeconds);

  // 2. Set to in-memory fallback
  memoryCache.set(key, {
    value,
    expireAt: Date.now() + ttlSeconds * 1000,
  });
}

// Popular leagues to filter matches (so we don't display hundreds of unknown leagues)
const POPULAR_LEAGUES = new Set([
  42,   // Champions League
  73,   // Europa League
  47,   // English Premier League
  87,   // Spanish La Liga
  54,   // German Bundesliga
  55,   // Italian Serie A
  53,   // French Ligue 1
  339,  // Thai League 1
  9224, // Thai League (alternative ID if applicable)
]);

async function fetchFromFotmob(url) {
  return fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    }
  });
}

// 1. Football News Endpoint
router.get("/news", async (req, res) => {
  const cacheKey = "fotmob:news";
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const response = await fetchFromFotmob("https://www.fotmob.com/api/worldnews");
    if (!response.ok) {
      throw new Error(`FotMob News returned status: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse news items
    // FotMob structure can have direct array or nested items (e.g. data.news or data.main)
    const newsItems = [];
    const rawNews = data.news || data.main || [];
    
    // Flatten and normalize news structure
    if (Array.isArray(rawNews)) {
      rawNews.forEach(item => {
        if (item.title && item.pageUrl) {
          newsItems.push({
            title: item.title,
            imageUrl: item.imageUrl || item.image || null,
            source: item.sourceName || item.source || "FotMob",
            time: item.time || item.relativeTime || "",
            pageUrl: item.pageUrl.startsWith("http") ? item.pageUrl : `https://www.fotmob.com${item.pageUrl}`,
          });
        }
      });
    }

    const result = { news: newsItems.slice(0, 10) };
    await setCachedData(cacheKey, result, 3600); // Cache for 1 hour

    res.status(200).json(result);
  } catch (error) {
    console.error("[FotMob News Error]:", error.message);
    res.status(500).json({ message: "Failed to fetch football news" });
  }
});

// 2. Football Matches Endpoint
router.get("/matches", async (req, res) => {
  const date = req.query.date; // Expecting YYYYMMDD
  if (!date) {
    return res.status(400).json({ message: "Date parameter is required (format: YYYYMMDD)" });
  }

  const cacheKey = `fotmob:matches:${date}`;
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const response = await fetchFromFotmob(`https://www.fotmob.com/api/matches?date=${date}`);
    if (!response.ok) {
      throw new Error(`FotMob Matches returned status: ${response.status}`);
    }

    const data = await response.json();
    const leagues = data.leagues || [];
    const filteredLeagues = [];

    // Filter leagues to only show matches from popular leagues
    leagues.forEach(league => {
      if (POPULAR_LEAGUES.has(league.id)) {
        const matches = (league.matches || []).map(match => ({
          id: match.id,
          home: {
            id: match.home.id,
            name: match.home.name,
            score: match.home.score,
          },
          away: {
            id: match.away.id,
            name: match.away.name,
            score: match.away.score,
          },
          status: {
            finished: match.status?.finished || false,
            started: match.status?.started || false,
            cancelled: match.status?.cancelled || false,
            liveTime: match.status?.liveTime || null,
            scoreStr: match.status?.scoreStr || null,
            reason: match.status?.reason || null,
            startDateStr: match.status?.startDateStr || match.time || "",
          }
        }));

        if (matches.length > 0) {
          filteredLeagues.push({
            id: league.id,
            name: league.name,
            ccode: league.ccode,
            matches,
          });
        }
      }
    });

    const result = { leagues: filteredLeagues };

    // Determine cache TTL:
    // If date is today, cache for 2 minutes (live updates). If not today, cache for 1 hour.
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const ttl = (date === todayStr) ? 120 : 3600;

    await setCachedData(cacheKey, result, ttl);
    res.status(200).json(result);
  } catch (error) {
    console.error("[FotMob Matches Error]:", error.message);
    res.status(500).json({ message: "Failed to fetch matches" });
  }
});

// 3. League Standings Endpoint
router.get("/standings", async (req, res) => {
  const leagueId = req.query.leagueId || "47"; // Default Premier League
  const cacheKey = `fotmob:standings:${leagueId}`;

  try {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const response = await fetchFromFotmob(`https://www.fotmob.com/api/leagues?id=${leagueId}`);
    if (!response.ok) {
      throw new Error(`FotMob League returned status: ${response.status}`);
    }

    const data = await response.json();
    const tableData = data.table || {};
    
    // Find the standard table list (usually it is inside table.all or table[0].table.all)
    let rawTable = [];
    if (tableData.all) {
      rawTable = tableData.all;
    } else if (Array.isArray(tableData.tables) && tableData.tables[0]?.table?.all) {
      rawTable = tableData.tables[0].table.all;
    } else if (Array.isArray(tableData) && tableData[0]?.table?.all) {
      rawTable = tableData[0].table.all;
    }

    const standings = rawTable.map(team => ({
      idx: team.idx,
      id: team.id,
      name: team.name,
      played: team.played,
      wins: team.wins,
      draws: team.draws,
      losses: team.losses,
      pts: team.pts,
      goalConDiff: team.goalConDiff || (team.scoresStr || "").split("-"),
    }));

    const result = { standings };
    await setCachedData(cacheKey, result, 3600); // Cache for 1 hour

    res.status(200).json(result);
  } catch (error) {
    console.error("[FotMob Standings Error]:", error.message);
    res.status(500).json({ message: "Failed to fetch standings" });
  }
});

module.exports = router;
