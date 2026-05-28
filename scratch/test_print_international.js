async function test() {
  try {
    const res = await fetch('http://localhost:5000/fotmob/all-leagues');
    if (!res.ok) {
      console.log("Local API failed, status:", res.status);
      return;
    }
    const data = await res.json();
    console.log("Keys of data:", Object.keys(data));
    console.log("International count:", data.international?.length);
    if (data.international) {
      console.log("Leagues in international:", data.international.map(l => ({ id: l.id, name: l.name, localizedName: l.localizedName })));
    }
  } catch (err) {
    console.error(err);
  }
}
test();
