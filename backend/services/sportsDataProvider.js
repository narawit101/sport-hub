const { getCache, setCache } = require("../config/cache");
const {
  enrichLeagueCountry,
  translateAllLeagues,
  translateTeamDynamic,
  buildTeamTranslationLookup,
} = require("../utils/fotmobCountryResolver");

/**
 * SportsDataProvider Module
 * Deep Domain Adapter for fetching, normalizing, caching, and localizing
 * live sports data into clean SportsDomainDTO structures.
 */
class SportsDataProvider {
  async fetchFromFotmob(url) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://www.fotmob.com/",
        "Origin": "https://www.fotmob.com",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`FotMob API HTTP Error: ${response.status}`);
    }
    return await response.json();
  }

  async getAllLeagues() {
    const cacheKey = "fotmob:all-leagues:v9";
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromFotmob("https://www.fotmob.com/api/data/allLeagues");
    const translated = translateAllLeagues(data);

    await setCache(cacheKey, translated, 86400); // 24 Hours TTL
    return translated;
  }

  async getMatchesByDate(dateStr) {
    const cacheKey = `fotmob:matches:${dateStr}:v9`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const targetUrl = `https://www.fotmob.com/api/data/matches?date=${dateStr}&timezone=Asia/Bangkok&locale=th&ccode3=THA`;

    const [rawAllLeagues, rawMatchesData] = await Promise.all([
      this.getAllLeagues().catch(() => null),
      this.fetchFromFotmob(targetUrl),
    ]);

    const teamLookup = rawAllLeagues ? buildTeamTranslationLookup(rawAllLeagues) : null;

    if (rawMatchesData && Array.isArray(rawMatchesData.leagues)) {
      rawMatchesData.leagues = rawMatchesData.leagues.map((league) => {
        const enriched = rawAllLeagues ? enrichLeagueCountry(league, rawAllLeagues) : league;

        if (Array.isArray(enriched.matches)) {
          enriched.matches = enriched.matches.map((m) => ({
            ...m,
            home: {
              ...m.home,
              name: translateTeamDynamic(m.home, teamLookup),
            },
            away: {
              ...m.away,
              name: translateTeamDynamic(m.away, teamLookup),
            },
          }));
        }
        return enriched;
      });
    }

    await setCache(cacheKey, rawMatchesData, 120); // 2 minutes TTL
    return rawMatchesData;
  }

  async getLeagueDetails(leagueId, season = "") {
    const cacheKey = `fotmob:standings:${leagueId}:${season}:v9`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    let targetUrl = `https://www.fotmob.com/api/data/leagues?id=${leagueId}&locale=th&ccode3=THA`;
    if (season) {
      targetUrl += `&season=${encodeURIComponent(season)}`;
    }

    const [allLeagues, data] = await Promise.all([
      this.getAllLeagues().catch(() => null),
      this.fetchFromFotmob(targetUrl),
    ]);

    const teamLookup = allLeagues ? buildTeamTranslationLookup(allLeagues) : null;
    const tableObj = data.overview?.table?.[0] || data.table?.[0];
    let tablesResult = [];

    if (tableObj) {
      const teamForm = tableObj.teamForm || {};

      const processTable = (rawTable) => {
        return rawTable.map((team) => ({
          idx: team.idx,
          id: team.id,
          name: translateTeamDynamic(team, teamLookup),
          played: team.played,
          wins: team.wins,
          draws: team.draws,
          losses: team.losses,
          pts: team.pts,
          goalConDiff: team.goalConDiff,
          scoresStr: team.scoresStr,
          qualColor: team.qualColor,
          form: teamForm[team.id] || [],
        }));
      };

      if (tableObj.data?.tables) {
        tableObj.data.tables.forEach((tGroup) => {
          const rawTable = tGroup.table?.all || [];
          tablesResult.push({
            groupName: tGroup.leagueName || "",
            standings: processTable(rawTable),
            legend: tGroup.legend || [],
          });
        });
      } else if (tableObj.data?.table?.all) {
        const rawTable = tableObj.data.table.all;
        const legendArr = tableObj.data.legend || [];
        tablesResult.push({
          groupName: "",
          standings: processTable(rawTable),
          legend: legendArr,
        });
      } else if (tableObj.table?.all) {
        const rawTable = tableObj.table.all;
        const legendArr = tableObj.legend || [];
        tablesResult.push({
          groupName: "",
          standings: processTable(rawTable),
          legend: legendArr,
        });
      }
    }

    const result = {
      tables: tablesResult,
      allAvailableSeasons: data.allAvailableSeasons || [],
      leagueName: data.details?.name || data.overview?.leagueName || data.table?.[0]?.leagueName || "",
    };

    await setCache(cacheKey, result, 3600); // 1 Hour TTL
    return result;
  }

  async getNews() {
    const cacheKey = "fotmob:news:v10";
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    let rawNews = [];
    try {
      rawNews = await this.fetchFromFotmob("https://www.fotmob.com/api/worldnews?lang=en");
    } catch (err) {
      console.error("[SportsDataProvider] News fetch fallback error:", err.message);
    }

    const newsList = Array.isArray(rawNews)
      ? rawNews.map((item) => {
          let pageUrl = item.pageUrl || item.link || item.url || "";
          if (!pageUrl && item.page?.url) {
            pageUrl = item.page.url.startsWith("http")
              ? item.page.url
              : `https://www.fotmob.com${item.page.url}`;
          }
          return {
            id: item.id,
            title: item.title,
            imageUrl: item.imageUrl,
            pageUrl: pageUrl,
            source: item.source || item.sourceStr || "FotMob",
            time: item.time || item.gmtTime,
            sourceIconUrl: item.sourceIconUrl,
          };
        })
      : [];

    const result = { news: newsList };
    await setCache(cacheKey, result, 600); // 10 minutes TTL
    return result;
  }
}

module.exports = new SportsDataProvider();
