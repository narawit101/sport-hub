async function inspect() {
  const dates = ['20260520', '20260521', '20260522', '20260523', '20260524', '20260525', '20260526', '20260527', '20260528'];
  
  for (const date of dates) {
    const url = `https://www.fotmob.com/api/data/matches?date=${date}&timezone=Asia/Bangkok&ccode3=THA&includeNextDayLateNight=true`;
    console.log('Checking date:', date);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        }
      });
      const data = await res.json();
      if (!data.leagues) continue;
      
      for (const league of data.leagues) {
        for (const m of league.matches || []) {
          // Check for shootout fields
          const keys = Object.keys(m.status || {});
          const hasPen = keys.some(k => k.toLowerCase().includes('pen') || k.toLowerCase().includes('shootout'));
          
          // Let's print status structure if it looks like a shootout
          if (hasPen || m.status?.reason?.short === 'Pen' || m.status?.reason?.long?.includes('Penalties') || m.status?.penScore) {
            console.log(`FOUND SHOOTOUT MATCH on date ${date} in league ${league.name}:`);
            console.log(JSON.stringify(m, null, 2));
            return;
          }
        }
      }
    } catch (err) {
      console.error('Error on date:', date, err.message);
    }
  }
  console.log('No shootout matches found in the date range.');
}

inspect();
