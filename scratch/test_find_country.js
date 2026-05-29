async function test() {
  const date = '20260528';
  const url = `https://www.fotmob.com/api/data/matches?date=${date}&timezone=Asia/Bangkok&ccode3=THA&includeNextDayLateNight=true`;
  console.log('Fetching', url);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
      }
    });
    const data = await res.json();
    if (!data.leagues) return;
    
    const ligaF = data.leagues.find(l => l.name.includes('Liga F') || l.name.includes('Spain') || l.id === 8991 || String(l.id) === '8991');
    if (ligaF) {
      console.log('Liga F league object:', JSON.stringify(ligaF, null, 2).slice(0, 500));
    } else {
      console.log('Liga F not found. Listing all leagues keys and names:');
      data.leagues.forEach(l => {
        console.log(`- ID: ${l.id}, Name: ${l.name}, ccode: ${l.ccode}`);
      });
    }
  } catch (err) {
    console.error(err);
  }
}
test();
