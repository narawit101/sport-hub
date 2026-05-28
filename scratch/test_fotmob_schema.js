async function test() {
  try {
    const res = await fetch('https://www.fotmob.com/api/data/leagues?id=47&ccode3=THA');
    const data = await res.json();
    const tableObj = data.overview?.table?.[0];
    if (tableObj) {
      console.log("teamForm keys:", Object.keys(tableObj.teamForm || {}));
      console.log("Example teamForm details (first 2 keys):", Object.keys(tableObj.teamForm || {}).slice(0, 2));
      const firstTeamId = Object.keys(tableObj.teamForm || {})[0];
      if (firstTeamId) {
        console.log(`teamForm for team ${firstTeamId}:`, JSON.stringify(tableObj.teamForm[firstTeamId], null, 2));
      }
      
      // Let's also check tableObj.data.table.form
      const formTable = tableObj.data?.table?.form || [];
      if (formTable.length > 0) {
        console.log("Form table example:", JSON.stringify(formTable[0], null, 2));
      }
    }
  } catch (err) {
    console.error(err);
  }
}

test();
