async function test() {
  try {
    const res = await fetch('http://localhost:5000/fotmob/standings?leagueId=47');
    if (!res.ok) {
      console.log("Local API is not running or failed. Status:", res.status);
      return;
    }
    const data = await res.json();
    console.log("Keys returned from local API:", Object.keys(data));
    console.log("Legend returned:", data.legend);
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}
test();
