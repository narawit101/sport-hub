const { getCache, setCache } = require("../config/cache");
const {
  enrichLeagueCountry,
  translateAllLeagues,
  LEAGUE_ID_TO_NAME,
  translateTeamDynamic,
  buildTeamTranslationLookup,
  TEAM_NAME_MAP,
} = require("../utils/fotmobCountryResolver");

const LEGEND_TRANSLATIONS = {
  "champions league": "แชมเปียนส์ลีก",
  "europa league": "ยูโรปาลีก",
  "conference league qualification": "รอบคัดเลือกคอนเฟอเรนซ์ลีก",
  "europa conference league qualification": "รอบคัดเลือกยูโรปาคอนเฟอเรนซ์ลีก",
  "champions league qualification": "รอบคัดเลือกแชมเปียนส์ลีก",
  relegation: "การตกชั้น",
  "relegation play-off": "เพลย์ออฟตกชั้น",
  promotion: "การเลื่อนชั้น",
  "promotion play-off": "เพลย์ออฟเลื่อนชั้น",
};

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
    const cacheKey = "fotmob:all-leagues:v7";
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromFotmob("https://www.fotmob.com/api/data/allLeagues");
    const translated = translateAllLeagues(data);

    await setCache(cacheKey, translated, 86400); // 24 Hours TTL
    return translated;
  }

  async getMatchesByDate(dateStr) {
    const cacheKey = `fotmob:matches:${dateStr}:v7`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const [rawAllLeagues, rawMatchesData] = await Promise.all([
      this.getAllLeagues().catch(() => null),
      this.fetchFromFotmob(`https://www.fotmob.com/api/matches?date=${dateStr}`),
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

  async getLeagueDetails(leagueId) {
    const cacheKey = `fotmob:league:${leagueId}:v7`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const [allLeagues, data] = await Promise.all([
      this.getAllLeagues().catch(() => null),
      this.fetchFromFotmob(`https://www.fotmob.com/api/leagues?id=${leagueId}`),
    ]);

    const teamLookup = allLeagues ? buildTeamTranslationLookup(allLeagues) : null;

    if (data && data.table && Array.isArray(data.table)) {
      data.table = data.table.map((tableItem) => {
        if (tableItem.data && Array.isArray(tableItem.data.table?.all)) {
          tableItem.data.table.all = tableItem.data.table.all.map((row) => ({
            ...row,
            name: translateTeamDynamic({ name: row.name, id: row.id }, teamLookup),
          }));
        }
        if (tableItem.data && Array.isArray(tableItem.data.legend)) {
          tableItem.data.legend = tableItem.data.legend.map((leg) => ({
            ...leg,
            title: LEGEND_TRANSLATIONS[leg.title?.toLowerCase()?.trim()] || leg.title,
          }));
        }
        return tableItem;
      });
    }

    await setCache(cacheKey, data, 300); // 5 minutes TTL
    return data;
  }

  async getNews() {
    const cacheKey = "fotmob:news:v7";
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromFotmob("https://www.fotmob.com/api/worldnews?lang=en");

    await setCache(cacheKey, data, 600); // 10 minutes TTL
    return data;
  }
}

module.exports = new SportsDataProvider();
