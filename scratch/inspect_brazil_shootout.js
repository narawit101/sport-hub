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
    
    // Find Copa do Nordeste league (id 9429 or containing Nordeste)
    const league = data.leagues.find(l => l.name.includes('Nordeste') || l.id === 9429 || String(l.id) === '9429');
    if (league) {
      console.log('Copa do Nordeste matches found:', league.matches.length);
      league.matches.forEach(m => {
        console.log(`Match: ${m.home.name} vs ${m.away.name}`);
        console.log('Home properties:', Object.keys(m.home));
        console.log('Away properties:', Object.keys(m.away));
        console.log('Match Status:', JSON.stringify(m.status, null, 2));
      });
    } else {
      console.log('Copa do Nordeste not found.');
    }
  } catch (err) {
    console.error(err);
  }
}
test();
