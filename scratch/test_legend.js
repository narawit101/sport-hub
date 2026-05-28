async function test() {
  try {
    const res = await fetch('https://www.fotmob.com/api/data/leagues?id=47&ccode3=THA');
    const data = await res.json();
    const tableObj = data.overview?.table?.[0] || data.table?.[0];
    if (tableObj && tableObj.data) {
      console.log("Legend structure:", JSON.stringify(tableObj.data.legend, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}
test();
