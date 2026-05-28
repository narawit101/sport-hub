async function test() {
  try {
    const res = await fetch('https://www.fotmob.com/api/data/leagues?id=47&ccode3=THA');
    const data = await res.json();
    
    // Let's print all properties that contain "England" or "ENG" in data
    const matches = [];
    function search(obj, path = "") {
      if (!obj) return;
      if (typeof obj === "string") {
        if (obj === "England" || obj === "ENG" || obj.includes("อังกฤษ")) {
          matches.push({ path, value: obj });
        }
      } else if (typeof obj === "object") {
        for (const key in obj) {
          search(obj[key], `${path}.${key}`);
        }
      }
    }
    search(data);
    console.log("Matches found:", matches.slice(0, 10));
  } catch (err) {
    console.error(err);
  }
}
test();
