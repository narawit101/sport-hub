async function checkImage() {
  const ccodes = ['esp', 'tha', 'eng', 'col', 'bra', 'egy', 'irq'];
  for (const c of ccodes) {
    const url = `https://images.fotmob.com/image_resources/logo/teamlogo/${c}.png`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`${url} -> status: ${res.status}`);
    } catch (err) {
      console.error(url, err.message);
    }
  }
}
checkImage();
