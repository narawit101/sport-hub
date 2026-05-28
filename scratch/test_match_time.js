async function test() {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const res = await fetch(`https://www.fotmob.com/api/data/matches?date=${today}&timezone=Asia/Bangkok&ccode3=THA`);
    const data = await res.json();
    if (data.leagues && data.leagues[0]) {
      const match = data.leagues[0].matches[0];
      console.log("Match sample:", JSON.stringify(match, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
