const CCODE_TO_NAME = {
  ENG: "อังกฤษ",
  THA: "ไทย",
  ESP: "สเปน",
  GER: "เยอรมนี",
  ITA: "อิตาลี",
  FRA: "ฝรั่งเศส",
  INT: "นานาชาติ",
  COL: "โคลอมเบีย",
  BRA: "บราซิล",
  EGY: "อียิปต์",
  IRQ: "อิรัก",
  ARG: "อาร์เจนตินา",
  NED: "เนเธอร์แลนด์",
  POR: "โปรตุเกส",
  KOR: "เกาหลีใต้",
  JPN: "ญี่ปุ่น",
  USA: "สหรัฐอเมริกา",
  MEX: "เม็กซิโก",
  KSA: "ซาอุดีอาระเบีย",
  CHN: "จีน",
  AUS: "ออสเตรเลีย",
  BEL: "เบลเยียม",
  CRO: "โครเอเชีย",
  DEN: "เดนมาร์ก",
  SUI: "สวิตเซอร์แลนด์",
  SWE: "สวีเดน",
  TUR: "ตุรกี",
  UKR: "ยูเครน",
  URU: "อุรุกวัย",
  SEN: "เซเนกัล",
  MAR: "โมร็อกโก",
  NGA: "ไนจีเรีย",
  ALG: "แอลจีเรีย",
  CMR: "แคเมอรูน",
  GHA: "กานา",
  CIV: "ไอวอรีโคสต์",
  RSA: "แอฟริกาใต้",
  TUN: "ตูนิเซีย",
  SCO: "สกอตแลนด์",
  WAL: "เวลส์",
  NIR: "ไอร์แลนด์เหนือ",
  IRL: "ไอร์แลนด์",
  GRE: "กรีซ",
  AUT: "ออสเตรีย",
  CZE: "สาธารณรัฐเช็ก",
  POL: "โปแลนด์",
  ROU: "โรมาเนีย",
  RUS: "รัสเซีย",
  SRB: "เซอร์เบีย",
  HUN: "ฮังการี",
  FIN: "ฟินแลนด์",
  NOR: "นอร์เวย์",
  CHI: "ชิลี",
  ECU: "เอกวาดอร์",
  PAR: "ปารากวัย",
  PER: "เปรู",
  VEN: "เวเนซุเอลา",
  CRC: "คอสตาริกา",
  HON: "ฮอนดูรัส",
  JAM: "จาเมกา",
  PAN: "ปานามา",
  CAN: "แคนาดา",
  NZL: "นิวซีแลนด์",
  QAT: "กาตาร์",
  UAE: "สหรัฐอาหรับเอมิเรตส์",
  IND: "อินเดีย",
  VIE: "เวียดนาม",
  MAS: "มาเลเซีย",
  IDN: "อินโดนีเซีย",
  SGP: "สิงคโปร์",
  PHI: "ฟิลิปปินส์",
  MYA: "เมียนมา",
  CAM: "กัมพูชา",
  LAO: "ลาว",
  ZAF: "แอฟริกาใต้",
};

function normalizeCode(code) {
  return code ? String(code).toUpperCase() : "";
}

function buildCountryLookup(allLeagues) {
  const byLeagueId = new Map();
  const byCode = new Map();

  for (const group of allLeagues?.international || []) {
    for (const league of group.leagues || []) {
      byLeagueId.set(String(league.id), { name: "นานาชาติ", ccode: "INT" });
    }
  }

  for (const country of allLeagues?.countries || []) {
    const countryInfo = {
      name: country.localizedName || country.name,
      ccode: country.ccode,
    };
    byCode.set(normalizeCode(country.ccode), countryInfo);

    for (const league of country.leagues || []) {
      byLeagueId.set(String(league.id), countryInfo);
    }
  }

  return { byLeagueId, byCode };
}

function resolveLeagueCountry(league, allLeagues) {
  if (!league) return null;

  const { byLeagueId, byCode } = buildCountryLookup(allLeagues);
  const byId = byLeagueId.get(String(league.id));
  if (byId) return byId;

  const code = normalizeCode(league.countryCode || league.ccode);
  if (code === "INT") return { name: "นานาชาติ", ccode: "INT" };

  const byCountryCode = byCode.get(code);
  if (byCountryCode) return byCountryCode;

  if (CCODE_TO_NAME[code]) {
    return { name: CCODE_TO_NAME[code], ccode: code };
  }

  return null;
}

function enrichLeagueCountry(league, allLeagues) {
  const country = resolveLeagueCountry(league, allLeagues);
  if (!country) return league;

  return {
    ...league,
    countryName: country.name,
    countryCode: country.ccode,
    ccode: league.ccode || country.ccode,
  };
}

module.exports = {
  CCODE_TO_NAME,
  buildCountryLookup,
  enrichLeagueCountry,
  resolveLeagueCountry,
};
