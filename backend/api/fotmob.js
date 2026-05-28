const express = require("express");
const router = express.Router();
const { getCache, setCache } = require("../config/cache");

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

const POPULAR_LEAGUES = new Set([
  42,   // Champions League
  73,   // Europa League
  47,   // English Premier League
  87,   // Spanish La Liga
  54,   // German Bundesliga
  55,   // Italian Serie A
  53,   // French Ligue 1
  339,  // Thai League 1 (Verify ID)
]);

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

  const cacheKey = `fotmob:matches:v2:${date}`;
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) return res.status(200).json(cached);

    // Using the new data/matches endpoint discovered
    const response = await fetchFromFotmob(`https://www.fotmob.com/api/data/matches?date=${date}&timezone=Asia/Bangkok&ccode3=THA&includeNextDayLateNight=true`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const data = await response.json();
    const leagues = data.leagues || [];
    const filteredLeagues = [];

    leagues.forEach(league => {
      const matches = (league.matches || []).map(match => ({
        id: match.id,
        home: { id: match.home.id, name: match.home.name, score: match.home.score },
        away: { id: match.away.id, name: match.away.name, score: match.away.score },
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
        filteredLeagues.push({ id: league.id, name: league.name, ccode: league.ccode, matches });
      }
    });

    // Sort leagues so that popular leagues are at the top, and other leagues are alphabetical
    filteredLeagues.sort((a, b) => {
      const aPop = POPULAR_LEAGUES.has(a.id);
      const bPop = POPULAR_LEAGUES.has(b.id);
      if (aPop && !bPop) return -1;
      if (!aPop && bPop) return 1;
      if (aPop && bPop) {
        const order = [47, 339, 87, 54, 55, 53, 42, 73]; // EPL, Thai, La Liga, Bundesliga, Serie A, Ligue 1, UCL, UEL
        const indexA = order.indexOf(a.id);
        const indexB = order.indexOf(b.id);
        return (indexA !== -1 ? indexA : 99) - (indexB !== -1 ? indexB : 99);
      }
      return a.name.localeCompare(b.name);
    });

    const result = { leagues: filteredLeagues };
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
  const cacheKey = `fotmob:standings:v3:${leagueId}:${season || "current"}`;

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
    
    // The table structure in data/leagues: overview -> table -> [0] -> data -> table -> all
    let rawTable = [];
    let teamForm = {};
    try {
        if (data.overview?.table?.[0]?.data?.table?.all) {
            rawTable = data.overview.table[0].data.table.all;
            teamForm = data.overview.table[0].teamForm || {};
        } else if (data.table?.[0]?.table?.all) {
            rawTable = data.table[0].table.all;
            teamForm = data.table[0].teamForm || {};
        }
    } catch (e) {
        console.warn("Table structure unexpected, falling back");
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
      goalConDiff: team.goalConDiff,
      scoresStr: team.scoresStr,
      qualColor: team.qualColor,
      form: teamForm[team.id] || []
    }));

    const result = { 
      standings,
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
  const cacheKey = "fotmob:all-leagues:v1";
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) return res.status(200).json(cached);

    const response = await fetchFromFotmob("https://www.fotmob.com/api/data/allLeagues");
    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const data = await response.json();
    // Cache for 24 hours (86400 seconds)
    await setCachedData(cacheKey, data, 86400);

    res.status(200).json(data);
  } catch (error) {
    console.error("[FotMob All Leagues Error]:", error.message);
    res.status(500).json({ message: "Failed to fetch all leagues list" });
  }
});

module.exports = router;
