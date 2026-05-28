async function test() {
  try {
    const res = await fetch('https://www.fotmob.com/api/data/leagues?id=47&ccode3=THA');
    const data = await res.json();
    console.log("Details keys:", Object.keys(data.details || {}));
    if (data.details) {
      console.log("Details country:", data.details.country);
    }
  } catch (err) {
    console.error(err);
  }
}
test();
