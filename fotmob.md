# FotMob Integration Manual (Sport Hub)

This document explains the architecture and operation of the football data integration (Matches, Standings, News, Leagues) from FotMob used in the Sport Hub project, including the localization engine and caching strategies.

---

## 📂 Core Files
1. **`backend/services/sportsDataProvider.js`**: Deep Domain Adapter encapsulating FotMob data fetching, caching via `backend/config/cache.js`, Thai localization, and DTO normalization.
2. **`backend/api/fotmob.js`**: Thin HTTP proxy routes delegating data requests directly to `SportsDataProvider`.
3. **`backend/utils/fotmobCountryResolver.js`**: Comprehensive dictionary engine translating country, league, and team names into Thai.

---

## 📡 1. Data Fetching Logic

To avoid CORS issues and protect the origin server, the Backend acts as a proxy using the `fetchFromFotmob(url)` function. It impersonates a standard browser by setting specific headers (User-Agent, Accept-Language, Referer).

**Primary Endpoints:**
* **Live/Daily Matches:** `https://www.fotmob.com/api/data/matches?date={YYYYMMDD}&timezone=Asia/Bangkok&locale=th&ccode3=THA`
* **League Standings:** `https://www.fotmob.com/api/data/leagues?id={leagueId}&locale=th&ccode3=THA`
* **Football News:** `https://www.fotmob.com/api/data/tlnews` (Fallbacks to `/api/worldnews` if unavailable).
* **All Leagues List:** `https://www.fotmob.com/api/data/allLeagues` (Fetched in English to provide stable lookup keys for translation).

---

## ⚡ 2. Two-Tier Caching System

To prevent being rate-limited by FotMob and to ensure high performance, the system implements a **Two-Tier Cache**:
1. **Redis Cache:** Shared persistent cache (if configured).
2. **In-Memory Cache (Map):** High-speed local RAM cache.

### Time To Live (TTL) Configuration
* **Today's Matches (Live):** **120 Seconds (2 Minutes)**. This ensures scores and live times are near real-time.
* **Future/Past Matches:** **3600 Seconds (1 Hour)**.
* **League Standings:** **3600 Seconds (1 Hour)**.
* **Football News:** **3600 Seconds (1 Hour)**.
* **All Leagues List:** **86400 Seconds (1 Day)**.

### 🛠️ Manual Cache Refresh (Cache Versioning)
If you modify translation logic or mapping and want to see changes **immediately without restarting the server** or waiting for TTL to expire, update the **Cache Version** in `backend/api/fotmob.js`:

```javascript
// Example: Incrementing v25 to v26
const cacheKey = `fotmob:matches:v26:${date}`; 
const cacheKey = `fotmob:standings:v16:${leagueId}:${season}`;
```
Changing the version key forces the system to treat existing cache as invalid and fetch fresh, translated data from the source.

---

## 🇹🇭 3. Localization & Translation Engine

The system uses a prioritized translation logic in `backend/utils/fotmobCountryResolver.js` to convert English team/country names into Thai:

### `translateTeamDynamic(team, lookup)` Execution Order:
1. **Manual Mapping (`TEAM_NAME_MAP`):**
   * Checks if the exact English team name exists in our predefined dictionary.
   * *Best for:* Handling edge cases or specific naming preferences (e.g., `"Cape Verde": "กาบูเวร์ดี"`, `"USA": "สหรัฐอเมริกา"`).
2. **Dynamic Country Lookup:**
   * Compares the English team name against the global country database retrieved from FotMob's "All Leagues" API.
   * If "Egypt" is identified as a country with code "EGY", it automatically retrieves the Thai name from `CCODE_TO_NAME`.
3. **Country Code (`ccode`) Check:**
   * If the API provides a country code (e.g., `ccode: "THA"`), it maps directly to "ไทย".
4. **Fallback:**
   * If no match is found, the system displays the original name provided by FotMob (`team.name`).

### 📝 How to Add/Edit Team Translations
To add a new team translation, open `backend/utils/fotmobCountryResolver.js` and update the `TEAM_NAME_MAP` object:

```javascript
const TEAM_NAME_MAP = {
  "English Team Name": "Thai Name",
  "Egypt": "อียิปต์",
  "Cape Verde": "กาบูเวร์ดี",
};
```
*Note: Always increment the cache version in `fotmob.js` after editing this map.*

---

## 🌐 4. Internal API Endpoints (Used by Frontend)

The Sport Hub frontend consumes the following internal proxy routes:
* `GET /api/fotmob/matches?date=YYYYMMDD`: Retrieves matches for a specific date.
* `GET /api/fotmob/standings?leagueId=47`: Retrieves standings (defaults to Premier League).
* `GET /api/fotmob/news?startIndex=0`: Retrieves news with pagination support.
* `GET /api/fotmob/all-leagues`: Retrieves the complete league/tournament structure for menus.

---

## 💡 Key Takeaways
- **Near Real-Time:** Live matches update every 2 minutes via cache expiration.
- **Clean Code:** Dynamic lookup minimizes the need for a massive manual dictionary.
- **Stability:** English is used as the internal "All Leagues" key to ensure translation accuracy regardless of FotMob's Thai metadata availability.
