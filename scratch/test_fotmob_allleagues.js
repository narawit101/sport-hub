async function test() {
  try {
    const res = await fetch("https://www.fotmob.com/api/data/allLeagues");
    const data = await res.json();
    console.log("Raw FotMob allLeagues keys:", Object.keys(data));
    if (Array.isArray(data)) {
      console.log("It is an array! Length:", data.length);
      console.log("First element:", data[0]);
    } else {
      console.log("It is an object!");
    }
  } catch (err) {
    console.error(err);
  }
}
test();
