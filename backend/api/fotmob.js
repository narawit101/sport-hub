const express = require("express");
const router = express.Router();
const sportsDataProvider = require("../services/sportsDataProvider");

/**
 * FotMob Proxy API Routes
 * Thin HTTP route handlers delegating to SportsDataProvider Domain Adapter.
 */

// 1. Get all leagues
router.get("/all-leagues", async (req, res) => {
  try {
    const data = await sportsDataProvider.getAllLeagues();
    res.status(200).json(data);
  } catch (error) {
    console.error("[FotMob All Leagues Error]:", error.message);
    res.status(500).json({ message: "Failed to fetch leagues" });
  }
});

// 2. Get matches by date
router.get("/matches", async (req, res) => {
  try {
    const dateStr = req.query.date;
    if (!dateStr) {
      return res.status(400).json({ message: "date parameter is required" });
    }
    const data = await sportsDataProvider.getMatchesByDate(dateStr);
    res.status(200).json(data);
  } catch (error) {
    console.error("[FotMob Matches Error]:", error.message);
    res.status(500).json({ message: "Failed to fetch matches" });
  }
});

// 3. Get world news
router.get("/news", async (req, res) => {
  try {
    const data = await sportsDataProvider.getNews();
    res.status(200).json(data);
  } catch (error) {
    console.error("[FotMob News Error]:", error.message);
    res.status(500).json({ message: "Failed to fetch news" });
  }
});

// 4. Get league standings (supports /standings and /league-standings)
const handleStandings = async (req, res) => {
  try {
    const { leagueId, season } = req.query;
    if (!leagueId) {
      return res.status(400).json({ message: "leagueId is required" });
    }
    const data = await sportsDataProvider.getLeagueDetails(leagueId, season);
    res.status(200).json(data);
  } catch (error) {
    console.error("[FotMob Standings Error]:", error.message);
    res.status(500).json({ message: "Failed to fetch standings" });
  }
};

router.get("/standings", handleStandings);
router.get("/league-standings", handleStandings);

module.exports = router;
