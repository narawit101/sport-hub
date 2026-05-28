async function test() {
  try {
    const res = await fetch('https://www.fotmob.com/api/data/leagues?id=8965&ccode3=THA');
    const data = await res.json();
    const tableObj = data.table?.[0] || data.overview?.table?.[0];
    if (tableObj && tableObj.data) {
      console.log("tableObj.data keys:", Object.keys(tableObj.data));
      if (tableObj.data.table) {
        console.log("tableObj.data.table keys:", Object.keys(tableObj.data.table));
      }
      if (tableObj.data.tables) {
        console.log("tableObj.data.tables length:", tableObj.data.tables.length);
        console.log("tableObj.data.tables[0] keys:", Object.keys(tableObj.data.tables[0]));
        console.log("tableObj.data.tables[0].table keys:", Object.keys(tableObj.data.tables[0].table || {}));
      }
    }
  } catch (err) {
    console.error(err);
  }
}
test();
