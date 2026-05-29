const CCODE_TO_NAME = {
  // Europe
  ENG: "อังกฤษ",
  ESP: "สเปน",
  GER: "เยอรมนี",
  ITA: "อิตาลี",
  FRA: "ฝรั่งเศส",
  NED: "เนเธอร์แลนด์",
  POR: "โปรตุเกส",
  BEL: "เบลเยียม",
  CRO: "โครเอเชีย",
  DEN: "เดนมาร์ก",
  SUI: "สวิตเซอร์แลนด์",
  SWE: "สวีเดน",
  TUR: "ตุรกี",
  UKR: "ยูเครน",
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
  ISL: "ไอซ์แลนด์",
  BUL: "บัลแกเรีย",
  SVK: "สโลวาเกีย",
  SVN: "สโลวีเนีย",
  BIH: "บอสเนียและเฮอร์เซโกวีนา",
  MNE: "มอนเตเนโกร",
  MKD: "มาซิโดเนียเหนือ",
  ALB: "แอลเบเนีย",
  KOS: "โคโซโว",
  GEO: "จอร์เจีย",
  ARM: "อาร์เมเนีย",
  AZE: "อาเซอร์ไบจาน",
  CYP: "ไซปรัส",
  LUX: "ลักเซมเบิร์ก",
  MLT: "มอลตา",
  EST: "เอสโตเนีย",
  LVA: "ลัตเวีย",
  LTU: "ลิทัวเนีย",
  BLR: "เบลารุส",
  MDA: "มอลโดวา",
  AND: "อันดอร์รา",
  FRO: "หมู่เกาะแฟโร",
  GIB: "ยิบรอลตาร์",
  LIE: "ลิกเตนสไตน์",
  SMR: "ซานมารีโน",
  KAZ: "คาซัคสถาน",
  UZB: "อุซเบกิสถาน",

  // South America
  BRA: "บราซิล",
  ARG: "อาร์เจนตินา",
  COL: "โคลอมเบีย",
  URU: "อุรุกวัย",
  CHI: "ชิลี",
  ECU: "เอกวาดอร์",
  PAR: "ปารากวัย",
  PER: "เปรู",
  VEN: "เวเนซุเอลา",
  BOL: "โบลิเวีย",

  // North & Central America
  USA: "สหรัฐอเมริกา",
  MEX: "เม็กซิโก",
  CRC: "คอสตาริกา",
  HON: "ฮอนดูรัส",
  JAM: "จาเมกา",
  PAN: "ปานามา",
  CAN: "แคนาดา",
  SLV: "เอลซัลวาดอร์",
  GUA: "กัวเตมาลา",
  TRI: "ตรินิแดดและโตเบโก",
  HAI: "เฮติ",
  NCA: "นิการากัว",
  CUB: "คิวบา",
  CUR: "กูราเซา",

  // Asia
  THA: "ไทย",
  KOR: "เกาหลีใต้",
  JPN: "ญี่ปุ่น",
  KSA: "ซาอุดีอาระเบีย",
  CHN: "จีน",
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
  IRN: "อิหร่าน",
  IRQ: "อิรัก",
  SYR: "ซีเรีย",
  JOR: "จอร์แดน",
  LBN: "เลบานอน",
  OMA: "โอมาน",
  BHR: "บาห์เรน",
  KUW: "คูเวต",
  YEM: "เยเมน",
  PRK: "เกาหลีเหนือ",
  TPE: "ไทเป",
  HKG: "ฮ่องกง",
  BRU: "บรูไน",
  TKM: "เติร์กเมนิสถาน",
  TJK: "ทาจิกิสถาน",
  KGZ: "คีร์กีซสถาน",
  AFG: "อัฟกานิสถาน",
  PAL: "ปาเลสไตน์",
  MDV: "มัลดีฟส์",
  NPL: "เนปาล",
  BAN: "บังกลาเทศ",
  SRI: "ศรีลังกา",

  // Africa
  EGY: "อียิปต์",
  SEN: "เซเนกัล",
  MAR: "โมร็อกโก",
  NGA: "ไนจีเรีย",
  ALG: "แอลจีเรีย",
  CMR: "แคเมอรูน",
  GHA: "กานา",
  CIV: "ไอวอรีโคสต์",
  RSA: "แอฟริกาใต้",
  ZAF: "แอฟริกาใต้",
  TUN: "ตูนิเซีย",
  MLI: "มาลี",
  BFA: "บูร์กินาฟาโซ",
  COD: "คองโก ดีอาร์",
  CGO: "คองโก",
  GAB: "กาบอง",
  GNB: "กินี-บิสเซา",
  GUI: "กินี",
  MOZ: "โมซัมบิก",
  ANG: "แองโกลา",
  ZAM: "แซมเบีย",
  ZIM: "ซิมบับเว",
  UGA: "ยูกันดา",
  KEN: "เคนยา",
  TAN: "แทนซาเนีย",
  ETH: "เอธิโอเปีย",
  MAD: "มาดากัสการ์",
  LBY: "ลิเบีย",
  SDN: "ซูดาน",
  GAM: "แกมเบีย",
  NAM: "นามิเบีย",
  BEN: "เบนิน",
  TOG: "โตโก",
  NIG: "ไนเจอร์",
  MTN: "มอริเตเนีย",
  RWA: "รวันดา",
  BDI: "บุรุนดี",
  SLE: "เซียร์ราลีโอน",
  LBR: "ไลบีเรีย",
  CPV: "กาบูเวร์ดี",
  EQG: "อิเควทอเรียลกินี",
  CHA: "ชาด",
  MWI: "มาลาวี",
  BOT: "บอตสวานา",
  SWZ: "เอสวาตินี",
  LES: "เลโซโท",
  CAR: "สาธารณรัฐแอฟริกากลาง",
  SSD: "ซูดานใต้",
  COM: "คอโมโรส",
  DJI: "จิบูตี",
  ERI: "เอริเทรีย",
  SOM: "โซมาเลีย",
  MRI: "มอริเชียส",
  STP: "เซาตูเมและปรินซิปี",
  SEY: "เซเชลส์",

  // Oceania
  AUS: "ออสเตรเลีย",
  NZL: "นิวซีแลนด์",

  // International
  INT: "นานาชาติ",
};

const TEAM_NAME_MAP = {
  // National Teams (English -> Thai)
  Egypt: "อียิปต์",
  Russia: "รัสเซีย",
  Ireland: "ไอร์แลนด์",
  Qatar: "กาตาร์",
  Iran: "อิหร่าน",
  Gambia: "แกมเบีย",
  Iraq: "อิรัก",
  Andorra: "อันดอร์รา",
  "South Africa": "แอฟริกาใต้",
  Nicaragua: "นิการากัว",
  Canada: "แคนาดา",
  "Bosnia and Herzegovina": "บอสเนียและเฮอร์เซโกวีนา",
  USA: "สหรัฐอเมริกา",
  "United States": "สหรัฐอเมริกา",
  Paraguay: "ปารากวัย",
  England: "อังกฤษ",
  Spain: "สเปน",
  Germany: "เยอรมนี",
  Italy: "อิตาลี",
  France: "ฝรั่งเศส",
  Netherlands: "เนเธอร์แลนด์",
  Portugal: "โปรตุเกส",
  Brazil: "บราซิล",
  Argentina: "อาร์เจนตินา",
  Japan: "ญี่ปุ่น",
  "South Korea": "เกาหลีใต้",
  Thailand: "ไทย",
  Vietnam: "เวียดนาม",
  Australia: "ออสเตรเลีย",
  Belgium: "เบลเยียม",
  Croatia: "โครเอเชีย",
  Denmark: "เดนมาร์ก",
  Switzerland: "สวิตเซอร์แลนด์",
  Sweden: "สวีเดน",
  Turkey: "ตุรกี",
  Ukraine: "ยูเครน",
  Scotland: "สกอตแลนด์",
  Wales: "เวลส์",
  Greece: "กรีซ",
  Austria: "ออสเตรีย",
  "Czech Republic": "สาธารณรัฐเช็ก",
  Poland: "โปแลนด์",
  Romania: "โรมาเนีย",
  Serbia: "เซอร์เบีย",
  Hungary: "ฮังการี",
  Norway: "นอร์เวย์",
  Bulgaria: "บัลแกเรีย",
  Slovakia: "สโลวาเกีย",
  Slovenia: "สโลวีเนีย",
  Mexico: "เม็กซิโก",
  "Costa Rica": "คอสตาริกา",
  Colombia: "โคลอมเบีย",
  Uruguay: "อุรุกวัย",
  Chile: "ชิลี",
  Ecuador: "เอกวาดอร์",
  Peru: "เปรู",
  Venezuela: "เวเนซุเอลา",
  Morocco: "โมร็อกโก",
  Senegal: "เซเนกัล",
  Nigeria: "ไนจีเรีย",
  Algeria: "แอลจีเรีย",
  Cameroon: "แคเมอรูน",
  Ghana: "กานา",
  "Ivory Coast": "ไอวอรีโคสต์",
  Tunisia: "ตูนิเซีย",
  "Saudi Arabia": "ซาอุดีอาระเบีย",
  China: "จีน",
  "United Arab Emirates": "สหรัฐอาหรับเอมิเรตส์",
  Jordan: "จอร์แดน",
  Syria: "ซีเรีย",
  Oman: "โอมาน",
  Uzbekistan: "อุซเบกิสถาน",
  Palestine: "ปาเลสไตน์",
  Haiti: "เฮติ",
  Curacao: "กูราเซา",
  "DR Congo": "คองโก ดีอาร์",
  Congo: "คองโก",
  "New Zealand": "นิวซีแลนด์",
  "Northern Ireland": "ไอร์แลนด์เหนือ",
  Panama: "ปานามา",
  "Cape Verde": "กาบูเวร์ดี",
  "Cabo Verde": "กาบูเวร์ดี",
};

const LEAGUE_ID_TO_NAME = {
  47: "พรีเมียร์ลีก อังกฤษ",
  77: "ฟุตบอลโลก",
  8984: "ไทยลีก 1",
  87: "ลาลีกา สเปน",
  54: "บุนเดสลีกา เยอรมัน",
  55: "กัลโช่ เซเรีย อา อิตาลี",
  53: "ลีกเอิง ฝรั่งเศส",
  42: "ยูฟ่า แชมเปียนส์ลีก",
  73: "ยูฟ่า ยูโรปาลีก",
  44: "เอฟเอ คัพ อังกฤษ",
  45: "คาราบาว คัพ อังกฤษ",
  48: "แชมเปียนชิพ อังกฤษ",
  71: "ยูฟ่า เนชันส์ลีก",
  67: "โคปา อเมริกา",
  50: "โกปา เดล เรย์",
  57: "โคปปา อิตาเลีย",
  52: "เดเอฟเบ โพคาล",
  63: "เฟรนช์ คัพ",
  102: "เอเอฟซี แชมเปียนส์ลีก",
  9806: "เอเอฟซี แชมเปียนส์ลีก 2",
  9064: "คิงส์ คัพ",
};

function normalizeCode(code) {
  return code ? String(code).toUpperCase() : "";
}

function translateAllLeagues(allLeagues) {
  if (!allLeagues) return allLeagues;

  const translated = JSON.parse(JSON.stringify(allLeagues));

  // Translate International Leagues
  if (translated.international) {
    translated.international.forEach(group => {
      if (group.leagues) {
        group.leagues.forEach(league => {
          if (LEAGUE_ID_TO_NAME[league.id]) {
            league.localizedName = LEAGUE_ID_TO_NAME[league.id];
          }
        });
      }
    });
  }

  // Translate Countries and their Leagues
  if (translated.countries) {
    translated.countries.forEach(country => {
      const code = normalizeCode(country.ccode);
      if (CCODE_TO_NAME[code]) {
        country.localizedName = CCODE_TO_NAME[code];
      }

      if (country.leagues) {
        country.leagues.forEach(league => {
          if (LEAGUE_ID_TO_NAME[league.id]) {
            league.localizedName = LEAGUE_ID_TO_NAME[league.id];
          }
        });
      }
    });
  }

  return translated;
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
    const code = normalizeCode(country.ccode);
    // Prioritize Thai name from CCODE_TO_NAME over FotMob's English name
    const thaiName = CCODE_TO_NAME[code];
    const countryInfo = {
      name: thaiName || country.localizedName || country.name,
      ccode: country.ccode,
    };
    byCode.set(code, countryInfo);

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

function buildTeamTranslationLookup(allLeagues) {
  const lookup = new Map();

  // 1. Pre-populate with codes from CCODE_TO_NAME
  for (const [code, thaiName] of Object.entries(CCODE_TO_NAME)) {
    lookup.set(code.toLowerCase(), thaiName);
  }

  if (!allLeagues) return lookup;

  // 2. Map English country names to Thai
  for (const country of allLeagues.countries || []) {
    const code = normalizeCode(country.ccode);
    const thaiName = CCODE_TO_NAME[code];
    if (thaiName && country.name) {
      const engName = String(country.name).toLowerCase();
      lookup.set(engName, thaiName);

      // Add common variations
      if (engName.includes("-")) {
        lookup.set(engName.replace(/-/g, " "), thaiName);
      }
      if (engName === "congo dr") {
        lookup.set("dr congo", thaiName);
      }
      if (engName === "ivory coast") {
        lookup.set("côte d'ivoire", thaiName);
      }
    }
  }
  return lookup;
}

function translateTeamDynamic(team, lookup) {
  if (!team) return "";
  const name = String(team.name || "").trim();

  // 1. Try manual map first (Highest priority)
  if (TEAM_NAME_MAP[name]) {
    return TEAM_NAME_MAP[name];
  }

  // 2. Try dynamic lookup (English Country Name -> Thai)
  const nameKey = name.toLowerCase();
  if (lookup && lookup.has(nameKey)) {
    return lookup.get(nameKey);
  }

  // 3. Try team-specific ccode if available
  const teamCode = normalizeCode(team.ccode);
  if (teamCode && CCODE_TO_NAME[teamCode]) {
    return CCODE_TO_NAME[teamCode];
  }

  return team.localizedName || team.name;
}

module.exports = {
  CCODE_TO_NAME,
  LEAGUE_ID_TO_NAME,
  TEAM_NAME_MAP,
  buildCountryLookup,
  buildTeamTranslationLookup,
  enrichLeagueCountry,
  resolveLeagueCountry,
  translateAllLeagues,
  translateTeamDynamic,
};
