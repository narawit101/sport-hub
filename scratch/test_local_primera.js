async function test() {
  try {
    const res = await fetch('http://localhost:5000/fotmob/standings?leagueId=8965');
    if (!res.ok) {
      console.log("Local API failed, status:", res.status);
      return;
    }
    const data = await res.json();
    console.log("Keys returned:", Object.keys(data));
    console.log("Tables count:", data.tables?.length);
    if (data.tables && data.tables.length > 0) {
      console.log("First table group name:", data.tables[0].groupName);
      console.log("First table standings count:", data.tables[0].standings?.length);
      console.log("First team in first table:", data.tables[0].standings?.[0]);
    }
  } catch (err) {
    console.error(err);
  }
}
test();
