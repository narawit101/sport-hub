async function test() {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const res = await fetch(`https://www.fotmob.com/api/data/matches?date=${today}&timezone=Asia/Bangkok&ccode3=THA`);
    const data = await res.json();
    console.log("Root keys:", Object.keys(data));
    if (data.leagues && data.leagues[0]) {
      const league = data.leagues[0];
      console.log("League sample metadata:", {
        id: league.id,
        name: league.name,
        ccode: league.ccode,
        parentLeagueName: league.parentLeagueName,
        parentLeagueId: league.parentLeagueId,
        country: league.country,
        keys: Object.keys(league)
      });
      
      // Let's search for matches that have red cards or penalty shootout info
      let foundRedCard = null;
      let foundPenScore = null;
      let foundLiveCount = null;
      
      for (const lg of data.leagues) {
        for (const m of lg.matches) {
          if (m.home?.redCards || m.away?.redCards) {
            foundRedCard = m;
          }
          if (m.status?.penScore || m.penaltyScore || m.home?.penScore || m.away?.penScore || JSON.stringify(m).includes("pen") || JSON.stringify(m).includes("Pen")) {
            foundPenScore = m;
          }
        }
      }
      
      if (foundRedCard) {
        console.log("Found match with red cards:", {
          homeName: foundRedCard.home.name,
          homeRedCards: foundRedCard.home.redCards,
          awayName: foundRedCard.away.name,
          awayRedCards: foundRedCard.away.redCards,
          rawMatch: foundRedCard
        });
      } else {
        console.log("No red cards found in today's matches.");
      }
      
      if (foundPenScore) {
        console.log("Found match with penalties:", {
          homeName: foundPenScore.home.name,
          awayName: foundPenScore.away.name,
          rawMatch: foundPenScore
        });
      } else {
        console.log("No penalty shootout matches found in today's matches.");
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
