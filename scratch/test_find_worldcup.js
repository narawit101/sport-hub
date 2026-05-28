async function test() {
  try {
    const res = await fetch('http://localhost:5000/fotmob/all-leagues');
    if (!res.ok) {
      console.log("Local API failed, status:", res.status);
      return;
    }
    const data = await res.json();
    console.log("International leagues count:", data.international?.length);
    
    // Find World Cup (id 77) or Champions League (id 42)
    const worldcup = data.international?.find(l => l.id === 77);
    const cl = data.international?.find(l => l.id === 42);
    
    console.log("World Cup in international:", worldcup);
    console.log("Champions League in international:", cl);
    
    // Print first 5 international leagues
    console.log("First 5 international leagues:", JSON.stringify(data.international?.slice(0, 5), null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
