export type DriveType = "ice" | "hybrid" | "electric";

export interface CarInput {
  make: string;
  model: string;
  year: number;
  engineSize: number | null; // liters
  fuelType: string;
  purchasePrice: number; // ILS
  annualMileageKm: number;
  holdingPeriodYears: number;
  driveType?: DriveType;       // user-selected powertrain type
  currentOdometerKm?: number;  // km already driven (affects maintenance estimate)
}

export interface TCOResult {
  // Fuel
  officialFuelConsumption: number; // L/100km (WLTP/manufacturer)
  officialKmPerLiter: number;      // km/L — official figure (0 = EV)
  realWorldFuelConsumption: number; // L/100km (Israeli conditions)
  realWorldKmPerLiter: number;     // km/L — Israeli real-world
  annualFuelCostILS: number;
  monthlyFuelCostILS: number;
  dataSource: "model-specific" | "engine-estimate"; // how consumption was derived

  // Maintenance
  annualMaintenanceCostILS: number;
  monthlyMaintenanceCostILS: number;

  // Insurance (ביטוח מקיף)
  annualInsuranceCostILS: number;
  monthlyInsuranceCostILS: number;

  // Depreciation
  depreciationRatePercent: number; // % per year
  annualDepreciationILS: number;
  monthlyDepreciationILS: number;
  residualValueILS: number; // after holding period

  // Scores (1-10, Israeli market)
  reliabilityScore: number;
  resaleScore: number;

  // Total
  annualTCO: number;
  monthlyTCO: number;
  totalHoldingCostILS: number;
}

const FUEL_PRICE_PER_LITER = 7.5; // ILS — Israeli average (95 octane)

// ─── Hebrew make name normalisations ─────────────────────────────────────────
// The Israeli govt API returns make names in Hebrew. We normalise to English.
const HEBREW_MAKE_MAP: Record<string, string> = {
  "טויוטה": "toyota",
  "יונדאי": "hyundai",
  "יונדאי ישראל": "hyundai",
  "קיה": "kia",
  "מזדה": "mazda",
  "מיצובישי": "mitsubishi",
  "מיצובישי תאילנ": "mitsubishi",
  "סוזוקי": "suzuki",
  "ניסן": "nissan",
  "הונדה": "honda",
  "פולקסווגן": "volkswagen",
  "סקודה": "skoda",
  "סיאט": "seat",
  "פורד": "ford",
  "אופל": "opel",
  "רנו": "renault",
  "פיג'ו": "peugeot",
  "סיטרואן": "citroen",
  "פיאט": "fiat",
  "ב.מ.וו": "bmw",
  "מרצדס": "mercedes",
  "אאודי": "audi",
  "וולוו": "volvo",
  "לקסוס": "lexus",
  "סובארו": "subaru",
  "שברולט": "chevrolet",
  "ג'יפ": "jeep",
  "דאצ'יה": "dacia",
  "אלפא רומיאו": "alfa romeo",
  "מיני": "mini",
  "לנד רובר": "land rover",
  "פורשה": "porsche",
  "מאזדה": "mazda",
};

function normaliseMake(raw: string): string {
  const trimmed = raw.trim();
  if (HEBREW_MAKE_MAP[trimmed]) return HEBREW_MAKE_MAP[trimmed];
  // Partial-match fallback
  for (const [heb, eng] of Object.entries(HEBREW_MAKE_MAP)) {
    if (trimmed.startsWith(heb.substring(0, 4))) return eng;
  }
  return trimmed.toLowerCase();
}

function normaliseModel(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

// ─── Model-specific WLTP fuel consumption (L/100km) ──────────────────────────
// Source: manufacturer WLTP figures, cross-referenced with EuroNCAP/ACEA data.
// Format: `make|model_keyword` → L/100km
// "model_keyword" is a substring match against the model name (lowercase).
// More specific entries should come first (they are checked in order).
const MODEL_FUEL_DB: Array<[string, string, number]> = [
  // ── Toyota ──────────────────────────────────────────────
  // Yaris/Yaris Cross (GR4 gen, 1.5 hybrid, ~2020+)
  ["toyota", "yaris cross", 4.6],
  ["toyota", "yaris gr", 7.4],
  ["toyota", "yaris", 4.8],       // 1.5 3-cyl hybrid (2020+); older 1.0 non-hybrid ~5.0
  // Corolla
  ["toyota", "corolla cross", 5.2],
  ["toyota", "corolla", 4.7],     // 2019+ 1.8/2.0 hybrid; older 1.6 petrol ~6.5
  // C-HR
  ["toyota", "c-hr", 5.0],        // 1.8 hybrid / 2.0 hybrid
  // RAV4
  ["toyota", "rav4 plug", 1.2],   // PHEV official
  ["toyota", "rav4", 6.0],        // 2.5 hybrid
  // Camry
  ["toyota", "camry", 5.0],       // 2.5 hybrid
  // Prius
  ["toyota", "prius", 4.2],
  // Highlander / Land Cruiser
  ["toyota", "highlander", 7.5],
  ["toyota", "land cruiser", 10.5],
  ["toyota", "hilux", 9.5],
  ["toyota", "avensis", 6.8],
  ["toyota", "auris", 5.5],
  ["toyota", "verso", 7.0],

  // ── Hyundai ─────────────────────────────────────────────
  ["hyundai", "ioniq 6", 0],        // EV
  ["hyundai", "ioniq 5", 0],        // EV
  ["hyundai", "ioniq plug", 1.1],   // PHEV
  ["hyundai", "ioniq hybrid", 3.9], // mild hybrid
  ["hyundai", "ioniq", 3.9],
  ["hyundai", "kona electric", 0],
  ["hyundai", "kona", 6.4],         // 1.0T
  ["hyundai", "tucson plug", 1.3],  // PHEV
  ["hyundai", "tucson hybrid", 5.9],
  ["hyundai", "tucson", 8.5],       // 1.6T / 2.0 petrol
  ["hyundai", "santa fe plug", 1.4],
  ["hyundai", "santa fe hybrid", 6.5],
  ["hyundai", "santa fe", 9.0],
  ["hyundai", "i10", 5.1],
  ["hyundai", "i20", 5.6],
  ["hyundai", "i30 n", 8.0],
  ["hyundai", "i30", 5.6],          // 1.0T/1.5T
  ["hyundai", "elantra", 6.4],
  ["hyundai", "sonata", 6.8],
  ["hyundai", "staria", 10.0],

  // ── Kia ─────────────────────────────────────────────────
  ["kia", "ev6", 0],
  ["kia", "niro electric", 0],
  ["kia", "niro plug", 1.3],
  ["kia", "niro hybrid", 4.8],
  ["kia", "niro", 4.8],
  ["kia", "sportage plug", 1.3],
  ["kia", "sportage hybrid", 6.0],
  ["kia", "sportage", 8.0],
  ["kia", "sorento plug", 1.5],
  ["kia", "sorento hybrid", 6.4],
  ["kia", "sorento", 9.2],
  ["kia", "picanto", 5.1],
  ["kia", "stonic", 6.2],
  ["kia", "rio", 5.7],
  ["kia", "ceed", 6.0],
  ["kia", "xceed", 6.2],
  ["kia", "proceed", 7.2],
  ["kia", "stinger", 10.0],

  // ── Mazda ───────────────────────────────────────────────
  ["mazda", "mx-30", 0],            // EV
  ["mazda", "cx-60 plug", 1.6],
  ["mazda", "cx-60", 6.4],
  ["mazda", "cx-5", 7.2],
  ["mazda", "cx-3", 6.2],
  ["mazda", "cx-30", 6.5],
  ["mazda", "mazda 2", 5.5],
  ["mazda", "mazda2", 5.5],
  ["mazda", "mazda 3", 6.0],        // SkyActiv-G 2.0
  ["mazda", "mazda3", 6.0],
  ["mazda", "mazda 6", 6.8],
  ["mazda", "mazda6", 6.8],

  // ── Mitsubishi ──────────────────────────────────────────
  ["mitsubishi", "outlander plug", 1.9], // PHEV
  ["mitsubishi", "outlander", 9.0],
  ["mitsubishi", "eclipse cross plug", 1.9],
  ["mitsubishi", "eclipse cross", 8.0],
  ["mitsubishi", "asx", 7.2],
  ["mitsubishi", "space star", 4.9],   // 1.2 3-cyl MIVEC
  ["mitsubishi", "colt", 5.1],
  ["mitsubishi", "galant", 8.5],
  ["mitsubishi", "lancer", 7.5],

  // ── Honda ───────────────────────────────────────────────
  ["honda", "e ", 0],               // Honda e EV
  ["honda", "cr-v plug", 1.4],
  ["honda", "cr-v hybrid", 6.0],
  ["honda", "cr-v", 8.0],
  ["honda", "hr-v", 6.3],
  ["honda", "jazz", 4.8],           // 1.5 i-MMD hybrid
  ["honda", "civic hybrid", 5.2],
  ["honda", "civic type r", 8.9],
  ["honda", "civic", 6.2],          // 1.5T
  ["honda", "accord hybrid", 5.5],
  ["honda", "accord", 7.5],

  // ── Volkswagen ──────────────────────────────────────────
  ["volkswagen", "id.3", 0],
  ["volkswagen", "id.4", 0],
  ["volkswagen", "id.5", 0],
  ["volkswagen", "golf gte", 1.5],  // PHEV
  ["volkswagen", "golf r", 8.0],
  ["volkswagen", "golf gti", 7.5],
  ["volkswagen", "golf", 5.8],      // 1.0/1.5 TSI
  ["volkswagen", "polo", 5.7],
  ["volkswagen", "tiguan plug", 1.6],
  ["volkswagen", "tiguan", 7.5],    // 1.5/2.0 TSI
  ["volkswagen", "touareg", 9.5],
  ["volkswagen", "t-roc", 6.5],
  ["volkswagen", "t-cross", 6.2],
  ["volkswagen", "passat", 6.3],
  ["volkswagen", "arteon", 7.0],
  ["volkswagen", "caddy", 7.5],
  ["volkswagen", "transporter", 9.5],

  // ── Skoda ───────────────────────────────────────────────
  ["skoda", "enyaq", 0],
  ["skoda", "octavia plug", 1.5],
  ["skoda", "octavia", 5.8],
  ["skoda", "fabia", 5.4],
  ["skoda", "scala", 5.8],
  ["skoda", "karoq", 6.5],
  ["skoda", "kodiaq", 7.5],
  ["skoda", "superb plug", 1.5],
  ["skoda", "superb", 6.5],
  ["skoda", "kamiq", 6.0],

  // ── SEAT / Cupra ────────────────────────────────────────
  ["seat", "born", 0],
  ["seat", "leon plug", 1.4],
  ["seat", "cupra formentor", 6.8],
  ["seat", "cupra leon", 6.5],
  ["seat", "leon", 5.8],
  ["seat", "ibiza", 5.5],
  ["seat", "arona", 6.0],
  ["seat", "ateca", 6.8],

  // ── Ford ────────────────────────────────────────────────
  ["ford", "mustang mach-e", 0],
  ["ford", "kuga plug", 1.2],
  ["ford", "kuga", 7.5],
  ["ford", "focus", 6.0],          // 1.0/1.5 EcoBoost
  ["ford", "fiesta", 5.5],
  ["ford", "puma", 5.8],
  ["ford", "explorer plug", 3.0],
  ["ford", "explorer", 10.0],
  ["ford", "mondeo", 7.2],
  ["ford", "ranger", 10.5],

  // ── Renault ─────────────────────────────────────────────
  ["renault", "zoe", 0],
  ["renault", "megane e-tech", 0],
  ["renault", "clio e-tech hybrid", 4.9],
  ["renault", "clio", 5.8],
  ["renault", "captur plug", 1.3],
  ["renault", "captur", 6.5],
  ["renault", "megane", 6.5],
  ["renault", "arkana hybrid", 5.0],
  ["renault", "arkana", 7.0],
  ["renault", "kadjar", 7.2],

  // ── Peugeot ─────────────────────────────────────────────
  ["peugeot", "e-208", 0],
  ["peugeot", "e-2008", 0],
  ["peugeot", "3008 plug", 1.2],
  ["peugeot", "3008", 7.0],
  ["peugeot", "508 plug", 1.2],
  ["peugeot", "508", 6.8],
  ["peugeot", "208", 5.7],         // 1.2 PureTech
  ["peugeot", "2008", 6.5],
  ["peugeot", "308 plug", 1.2],
  ["peugeot", "308", 6.0],
  ["peugeot", "5008", 8.5],

  // ── Citroën ─────────────────────────────────────────────
  ["citroen", "e-c4", 0],
  ["citroen", "c4", 6.2],
  ["citroen", "c3", 5.6],
  ["citroen", "c5 aircross plug", 1.6],
  ["citroen", "c5 aircross", 7.2],
  ["citroen", "c5", 8.0],
  ["citroen", "berlingo", 7.8],

  // ── Opel / Vauxhall ─────────────────────────────────────
  ["opel", "corsa-e", 0],
  ["opel", "mokka-e", 0],
  ["opel", "mokka", 6.2],
  ["opel", "corsa", 5.6],
  ["opel", "astra plug", 1.4],
  ["opel", "astra", 6.2],
  ["opel", "insignia", 7.0],
  ["opel", "crossland", 6.5],
  ["opel", "grandland plug", 1.5],
  ["opel", "grandland", 7.2],

  // ── Nissan ──────────────────────────────────────────────
  ["nissan", "leaf", 0],
  ["nissan", "ariya", 0],
  ["nissan", "qashqai e-power", 5.3],
  ["nissan", "qashqai", 7.5],
  ["nissan", "juke", 6.3],
  ["nissan", "micra", 5.4],
  ["nissan", "x-trail", 7.8],
  ["nissan", "pathfinder", 11.0],
  ["nissan", "navara", 10.5],

  // ── Suzuki ──────────────────────────────────────────────
  ["suzuki", "swift hybrid", 4.7],
  ["suzuki", "swift", 5.6],
  ["suzuki", "ignis hybrid", 4.8],
  ["suzuki", "ignis", 5.8],
  ["suzuki", "vitara hybrid", 5.5],
  ["suzuki", "vitara", 6.8],
  ["suzuki", "s-cross hybrid", 5.7],
  ["suzuki", "s-cross", 7.2],
  ["suzuki", "jimny", 8.1],
  ["suzuki", "baleno", 5.5],

  // ── BMW ─────────────────────────────────────────────────
  ["bmw", "ix3", 0],
  ["bmw", "ix", 0],
  ["bmw", "i4", 0],
  ["bmw", "i7", 0],
  ["bmw", "330e", 2.1],
  ["bmw", "530e", 2.1],
  ["bmw", "x1 plug", 1.7],
  ["bmw", "x3 plug", 1.8],
  ["bmw", "x5 plug", 2.1],
  ["bmw", "118i", 6.0],
  ["bmw", "120i", 6.4],
  ["bmw", "218i", 6.2],
  ["bmw", "318i", 6.6],
  ["bmw", "320i", 7.0],
  ["bmw", "330i", 7.5],
  ["bmw", "420i", 7.2],
  ["bmw", "520i", 7.5],
  ["bmw", "530i", 8.0],
  ["bmw", "x1", 6.5],
  ["bmw", "x2", 6.8],
  ["bmw", "x3", 8.0],
  ["bmw", "x4", 8.5],
  ["bmw", "x5", 10.0],
  ["bmw", "x6", 10.5],
  ["bmw", "m3", 11.5],
  ["bmw", "m5", 12.5],

  // ── Mercedes-Benz ────────────────────────────────────────
  ["mercedes", "eqb", 0],
  ["mercedes", "eqc", 0],
  ["mercedes", "eqs", 0],
  ["mercedes", "eqa", 0],
  ["mercedes", "a 180", 6.3],
  ["mercedes", "a 200", 6.8],
  ["mercedes", "a 250", 7.5],
  ["mercedes", "b 180", 6.3],
  ["mercedes", "b 200", 6.8],
  ["mercedes", "c 180", 6.7],
  ["mercedes", "c 200", 7.2],
  ["mercedes", "c 300", 8.0],
  ["mercedes", "e 200", 7.5],
  ["mercedes", "e 300", 8.5],
  ["mercedes", "glb 200", 7.0],
  ["mercedes", "glc 200", 8.0],
  ["mercedes", "gle 350", 10.5],
  ["mercedes", "cla 200", 6.8],
  ["mercedes", "gla 200", 7.0],

  // ── Audi ─────────────────────────────────────────────────
  ["audi", "e-tron gt", 0],
  ["audi", "q4 e-tron", 0],
  ["audi", "a3 40 tfsi e", 1.6],
  ["audi", "a3 30 tfsi", 6.2],
  ["audi", "a3 35 tfsi", 6.5],
  ["audi", "a4 35 tfsi", 7.0],
  ["audi", "a4 40 tfsi", 7.5],
  ["audi", "a6 40 tfsi", 7.5],
  ["audi", "a1", 5.8],
  ["audi", "a3", 6.3],
  ["audi", "a4", 7.2],
  ["audi", "a5", 7.5],
  ["audi", "a6", 7.8],
  ["audi", "q2", 6.5],
  ["audi", "q3", 7.2],
  ["audi", "q5 plug", 1.6],
  ["audi", "q5", 8.0],
  ["audi", "q7", 10.0],
  ["audi", "q8", 11.0],

  // ── Volvo ─────────────────────────────────────────────────
  ["volvo", "xc40 electric", 0],
  ["volvo", "c40", 0],
  ["volvo", "xc40 plug", 1.7],
  ["volvo", "xc60 plug", 2.0],
  ["volvo", "xc90 plug", 2.3],
  ["volvo", "xc40", 7.0],
  ["volvo", "xc60", 8.0],
  ["volvo", "xc90", 9.5],
  ["volvo", "s60", 7.2],
  ["volvo", "s90", 8.0],
  ["volvo", "v60", 7.0],
  ["volvo", "v90", 7.5],

  // ── Lexus ──────────────────────────────────────────────
  ["lexus", "ux 300e", 0],
  ["lexus", "ux hybrid", 4.6],
  ["lexus", "ux", 6.0],
  ["lexus", "es hybrid", 5.3],
  ["lexus", "es", 8.5],
  ["lexus", "is 300h", 5.8],
  ["lexus", "is", 8.5],
  ["lexus", "nx plug", 1.4],
  ["lexus", "nx hybrid", 5.4],
  ["lexus", "nx", 7.5],
  ["lexus", "rx hybrid", 6.0],
  ["lexus", "rx", 9.0],
  ["lexus", "lc 500h", 7.5],
  ["lexus", "ls hybrid", 7.0],

  // ── Subaru ─────────────────────────────────────────────
  ["subaru", "solterra", 0],
  ["subaru", "brz", 8.5],
  ["subaru", "wrx", 10.5],
  ["subaru", "impreza", 7.8],
  ["subaru", "legacy", 8.2],
  ["subaru", "outback", 8.5],
  ["subaru", "forester", 8.5],
  ["subaru", "xv", 8.0],
  ["subaru", "crosstrek", 8.0],
  ["subaru", "levorg", 8.0],

  // ── Fiat ───────────────────────────────────────────────
  ["fiat", "500e", 0],
  ["fiat", "500x", 7.0],
  ["fiat", "500", 5.5],
  ["fiat", "panda hybrid", 4.8],
  ["fiat", "panda", 5.6],
  ["fiat", "tipo", 6.5],

  // ── Dacia ──────────────────────────────────────────────
  ["dacia", "spring", 0],
  ["dacia", "sandero", 5.5],
  ["dacia", "duster", 7.5],
  ["dacia", "jogger hybrid", 5.2],
  ["dacia", "jogger", 6.5],

  // ── Jeep ───────────────────────────────────────────────
  ["jeep", "avenger electric", 0],
  ["jeep", "renegade plug", 1.5],
  ["jeep", "compass plug", 1.5],
  ["jeep", "wrangler plug", 3.3],
  ["jeep", "renegade", 7.5],
  ["jeep", "compass", 8.0],
  ["jeep", "cherokee", 9.5],
  ["jeep", "grand cherokee", 11.0],

  // ── Mini ───────────────────────────────────────────────
  ["mini", "electric", 0],
  ["mini", "cooper s", 7.0],
  ["mini", "cooper", 6.2],
  ["mini", "countryman plug", 1.9],
  ["mini", "countryman", 7.5],
  ["mini", "clubman", 7.0],

  // ── Alfa Romeo ─────────────────────────────────────────
  ["alfa romeo", "stelvio", 8.5],
  ["alfa romeo", "giulia", 7.5],
  ["alfa romeo", "tonale plug", 1.4],
  ["alfa romeo", "tonale", 7.2],

  // ── Chevrolet ──────────────────────────────────────────
  ["chevrolet", "spark", 6.0],
  ["chevrolet", "cruze", 7.5],
  ["chevrolet", "malibu", 9.0],
];

/**
 * Look up model-specific WLTP fuel consumption (L/100km).
 * Returns null if not found — caller falls back to engine-size estimate.
 */
function lookupModelFuel(make: string, model: string): number | null {
  const m = normaliseMake(make);
  const mo = normaliseModel(model);

  for (const [dbMake, modelKeyword, l100] of MODEL_FUEL_DB) {
    if (m === dbMake && mo.includes(modelKeyword)) return l100;
  }
  // Second pass: partial make match (handles prefixes / middle words)
  for (const [dbMake, modelKeyword, l100] of MODEL_FUEL_DB) {
    if (m.includes(dbMake) && mo.includes(modelKeyword)) return l100;
  }
  return null;
}

// ─── Israeli real-world correction factors ───────────────────────────────────
// Israel has heavy urban traffic (TLV/Jerusalem/Haifa), extreme summer heat
// requiring constant AC, and mountainous terrain. These factors push
// real-world consumption well above WLTP:
//   • Non-hybrid petrol/diesel: +30%  (WLTP already pessimistic vs NEDC, but
//     Israeli urban conditions add ~10-15% beyond typical EU real-world)
//   • Hybrid (parallel/series): +20%  (hybrid advantage shrinks in hot climates
//     due to AC load, but still significantly better than pure ICE)
//   • PHEV: +25% on CS mode; EV mode usage assumed 50/50 in Israeli context
//   • Full EV: +15% (heat/AC degrades range noticeably)

function getRealWorldCorrection(fuelType: string, officialL100: number): number {
  const ft = fuelType.toLowerCase();
  if (officialL100 === 0) return 1.15; // EV kWh increase
  if (ft.includes("היברידי") || ft.includes("hybrid")) return 1.20;
  if (ft.includes("plug") || officialL100 < 3.0) return 1.25; // PHEV
  return 1.30; // regular petrol/diesel
}

// ─── Fallback: engine-size estimate (when model not in DB) ───────────────────
function engineSizeEstimate(engineSize: number | null, fuelType: string, driveType?: DriveType): number {
  const ft = fuelType.toLowerCase();
  const isElectric = driveType === "electric" || ft.includes("חשמל") || ft.includes("electric");
  const isHybrid   = driveType === "hybrid"   || ft.includes("היברידי") || ft.includes("hybrid");

  if (isElectric) return 0;
  if (isHybrid) {
    return engineSize ? Math.max(4.0, engineSize * 2.8) : 5.0;
  }
  if (!engineSize) return 8.0;
  if (engineSize <= 1.0) return 5.5;
  if (engineSize <= 1.2) return 5.8;
  if (engineSize <= 1.4) return 6.2;
  if (engineSize <= 1.6) return 6.8;
  if (engineSize <= 1.8) return 7.4;
  if (engineSize <= 2.0) return 8.0;
  if (engineSize <= 2.5) return 9.0;
  if (engineSize <= 3.0) return 10.5;
  return 12.0;
}

// ─── Depreciation ────────────────────────────────────────────────────────────
// Based on Israeli classified-ad market data (yad2.co.il trends) and
// general brand residual value studies.
const DEPRECIATION_BY_MAKE: Record<string, number> = {
  toyota: 0.10,
  lexus: 0.11,
  honda: 0.11,
  mazda: 0.11,
  hyundai: 0.12,
  kia: 0.12,
  mitsubishi: 0.12,
  suzuki: 0.12,
  subaru: 0.13,
  nissan: 0.13,
  volkswagen: 0.13,
  skoda: 0.13,
  volvo: 0.13,
  seat: 0.14,
  bmw: 0.14,
  mercedes: 0.13,
  audi: 0.14,
  ford: 0.14,
  opel: 0.15,
  renault: 0.15,
  peugeot: 0.15,
  citroen: 0.15,
  fiat: 0.16,
  "alfa romeo": 0.16,
  dacia: 0.13,
  jeep: 0.14,
  mini: 0.14,
};

function getDepreciationRate(make: string, year: number): number {
  const m = normaliseMake(make);
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  let base = DEPRECIATION_BY_MAKE[m] ?? 0.13;

  // First 3 years depreciate faster (new-car premium loss)
  if (age < 3) base += 0.02;
  // Very old cars depreciate more slowly
  if (age > 10) base = Math.max(base - 0.02, 0.06);

  return Math.min(base, 0.20);
}

// ─── Maintenance tiers ────────────────────────────────────────────────────────
// Service intervals: small every 10k km, large every 20k km.
// Costs based on Israeli garage survey data (ILS, 2024).
type MaintenanceTier = "budget" | "mainstream" | "premium" | "luxury";

function getMaintenanceTier(make: string): MaintenanceTier {
  const m = normaliseMake(make);
  if (["bmw", "mercedes", "audi", "porsche", "jaguar", "land rover"].includes(m))
    return "luxury";
  if (["volvo", "lexus", "mini", "alfa romeo"].includes(m)) return "premium";
  if (["volkswagen", "skoda", "seat", "ford", "opel", "renault", "peugeot", "citroen", "nissan", "mazda", "subaru", "jeep"].includes(m))
    return "mainstream";
  return "budget"; // Toyota, Hyundai, Kia, Mitsubishi, Suzuki, Honda, etc.
}

const MAINTENANCE_COSTS: Record<MaintenanceTier, { small: number; large: number }> = {
  budget:     { small: 450,  large: 950  },
  mainstream: { small: 600,  large: 1350 },
  premium:    { small: 850,  large: 1900 },
  luxury:     { small: 1200, large: 2800 },
};

/**
 * Age multiplier — reflects the reality that older cars need more work beyond
 * routine services: timing components, suspension bushings, seals, sensors, etc.
 */
function ageMaintenanceMultiplier(carYear: number): number {
  const age = new Date().getFullYear() - carYear;
  if (age <= 2)  return 0.55; // mostly under warranty, only basic services
  if (age <= 4)  return 0.80; // warranty expired, still mostly services
  if (age <= 6)  return 1.00; // baseline
  if (age <= 9)  return 1.35; // wear items starting to fail (brakes, belts, tyres)
  if (age <= 12) return 1.75; // timing belt/chain, suspension, electrical gremlins
  if (age <= 16) return 2.20; // major repairs increasingly common
  return 2.70;                // 17+ yr old car, significant ongoing repairs
}

/**
 * Reliability multiplier — less reliable cars need more unscheduled repairs.
 * Score is the same reliability score (1–10) used for display.
 */
function reliabilityMaintenanceMultiplier(reliabilityScore: number): number {
  if (reliabilityScore >= 9.0) return 0.78;
  if (reliabilityScore >= 8.0) return 0.88;
  if (reliabilityScore >= 7.0) return 1.00;
  if (reliabilityScore >= 6.0) return 1.18;
  if (reliabilityScore >= 5.0) return 1.40;
  return 1.65;
}

/**
 * Odometer multiplier — higher accumulated mileage = more wear on engine,
 * transmission, and chassis components, raising expected annual repair costs.
 */
function odometerMaintenanceMultiplier(odometerKm: number): number {
  if (odometerKm <= 0)       return 1.00; // not provided / new
  if (odometerKm < 50_000)   return 0.90; // low mileage, minimal wear
  if (odometerKm < 100_000)  return 1.00; // baseline
  if (odometerKm < 150_000)  return 1.20; // increased wear on engine & drivetrain
  if (odometerKm < 200_000)  return 1.45; // likely needs major components soon
  return 1.75;                            // 200k+ km — significant ongoing repairs
}

function estimateAnnualMaintenance(
  annualMileageKm: number,
  make: string,
  carYear: number,
  reliabilityScore: number,
  currentOdometerKm?: number,
): number {
  const tier = getMaintenanceTier(make);
  const { small, large } = MAINTENANCE_COSTS[tier];
  // Per 20k km: 1 large + 1 small service (base routine cost)
  const cyclesPerYear = annualMileageKm / 20000;
  const baseRoutineCost = cyclesPerYear * (large + small);

  const ageFactor = ageMaintenanceMultiplier(carYear);
  const reliabilityFactor = reliabilityMaintenanceMultiplier(reliabilityScore);
  const odometerFactor = odometerMaintenanceMultiplier(currentOdometerKm ?? 0);

  // 1.95x multiplier: base routine covers oil/filters; real-world also includes
  // tire replacement, annual roadworthiness test (טסט), unplanned repairs, wipers, brakes, etc.
  return Math.round(Math.max(800, baseRoutineCost * ageFactor * reliabilityFactor * odometerFactor * 1.95));
}

// ─── Reliability scores (1–10) ───────────────────────────────────────────────
// Aggregated from JD Power IQS/VDS 2020-2024, Consumer Reports reliability
// surveys, ADAC breakdown data, and Israeli-market-specific service records.
// Scores reflect long-term (3–5 yr ownership) reliability, not just initial quality.
const RELIABILITY_SCORES: Record<string, number> = {
  lexus:        9.3,
  toyota:       9.1,
  mazda:        8.8,
  honda:        8.5,
  kia:          8.2,
  hyundai:      8.1,
  mitsubishi:   7.9,
  suzuki:       7.8,
  subaru:       7.7,
  dacia:        7.5,
  skoda:        7.3,
  volkswagen:   7.0,
  nissan:       7.0,
  volvo:        7.0,
  mini:         6.8,
  ford:         6.7,
  seat:         6.7,
  bmw:          6.5,
  mercedes:     6.5,
  jeep:         6.4,
  audi:         6.3,
  opel:         6.3,
  renault:      6.2,
  chevrolet:    6.2,
  peugeot:      5.9,
  citroen:      5.9,
  fiat:         5.6,
  "alfa romeo": 5.5,
};

// ─── Resale scores (1–10) ────────────────────────────────────────────────────
// Based on Israeli yad2.co.il market trends and average 3-yr resale value %.
// Toyota/Lexus hold value exceptionally well in Israel due to high demand
// and limited used-car supply for Japanese brands.
const RESALE_SCORES: Record<string, number> = {
  toyota:       9.2,
  lexus:        8.9,
  mazda:        8.4,
  honda:        8.3,
  kia:          7.9,
  hyundai:      7.8,
  mitsubishi:   7.5,
  subaru:       7.5,
  volkswagen:   7.5,
  skoda:        7.2,
  suzuki:       7.1,
  nissan:       7.0,
  bmw:          7.0,
  mercedes:     7.2,
  dacia:        6.9,
  volvo:        6.8,
  audi:         6.8,
  seat:         6.5,
  mini:         6.5,
  ford:         6.3,
  opel:         6.0,
  jeep:         6.0,
  renault:      5.8,
  peugeot:      5.5,
  citroen:      5.3,
  chevrolet:    5.5,
  fiat:         5.2,
  "alfa romeo": 5.0,
};

function getScore(map: Record<string, number>, make: string): number {
  const m = normaliseMake(make);
  if (map[m] !== undefined) return map[m];
  // Partial match fallback
  for (const [key, val] of Object.entries(map)) {
    if (m.includes(key) || key.includes(m)) return val;
  }
  return 6.5;
}

export interface TCOOverrides {
  /** Override annual maintenance cost (ILS) */
  maintenanceILS?: number;
  /** Override depreciation rate (e.g. 13 means 13% per year) */
  depreciationRatePercent?: number;
  /** Override real-world fuel efficiency (km/L) */
  realWorldKmL?: number;
  /** Override fuel price per liter (ILS) */
  fuelPricePerLiter?: number;
  /** Override annual comprehensive insurance cost (ILS) */
  insuranceILS?: number;
}

/** Estimate annual insurance (ביטוח מקיף + ביטוח חובה) based on car value and age */
export function estimateInsurance(purchasePrice: number, year: number): number {
  const age = new Date().getFullYear() - year;
  // Comprehensive (מקיף) rate as % of purchase price, decreasing with age
  const rate = age <= 2 ? 0.028 : age <= 5 ? 0.024 : age <= 10 ? 0.020 : 0.016;
  const comprehensive = purchasePrice * rate;
  const raw = comprehensive * 2.3;
  return Math.round(Math.max(3_500, Math.min(22_000, raw)));
}

// ─── Main TCO calculator ──────────────────────────────────────────────────────
export function calculateTCO(input: CarInput, overrides?: TCOOverrides): TCOResult {
  const { make, model, year, engineSize, fuelType, purchasePrice, annualMileageKm, holdingPeriodYears, driveType, currentOdometerKm } = input;

  const isEV = driveType === "electric" || fuelType.toLowerCase().includes("חשמל") || fuelType.toLowerCase().includes("electric");

  // ── Fuel consumption ──────────────────────────────────────────────────────
  const modelLookup = lookupModelFuel(make, model);
  const dataSource: TCOResult["dataSource"] = modelLookup !== null ? "model-specific" : "engine-estimate";
  const officialFuelConsumption = modelLookup ?? engineSizeEstimate(engineSize, fuelType, driveType);

  // Hybrid driveType overrides fuelType string for correction factor
  const effectiveFuelTypeForCorrection = driveType === "hybrid" ? "hybrid" : driveType === "electric" ? "electric" : fuelType;
  const rwCorrection = getRealWorldCorrection(effectiveFuelTypeForCorrection, officialFuelConsumption);
  const computedRealWorldL100 = officialFuelConsumption * rwCorrection;

  // Apply manual real-world km/L override → convert back to L/100km for cost calc
  const realWorldFuelConsumption = overrides?.realWorldKmL
    ? 100 / overrides.realWorldKmL
    : computedRealWorldL100;

  const effectiveFuelPrice = overrides?.fuelPricePerLiter ?? FUEL_PRICE_PER_LITER;

  let annualFuelCostILS: number;
  if (isEV || officialFuelConsumption === 0) {
    annualFuelCostILS = (18 * rwCorrection / 100) * annualMileageKm * 0.60;
  } else {
    annualFuelCostILS = (realWorldFuelConsumption / 100) * annualMileageKm * effectiveFuelPrice;
  }
  const monthlyFuelCostILS = annualFuelCostILS / 12;

  // ── Reliability / resale (scores not overridable) ─────────────────────────
  const reliabilityScore = getScore(RELIABILITY_SCORES, make);
  const resaleScore = getScore(RESALE_SCORES, make);

  // ── Maintenance ───────────────────────────────────────────────────────────
  const annualMaintenanceCostILS = overrides?.maintenanceILS
    ?? estimateAnnualMaintenance(annualMileageKm, make, year, reliabilityScore, currentOdometerKm);
  const monthlyMaintenanceCostILS = annualMaintenanceCostILS / 12;

  // ── Depreciation ──────────────────────────────────────────────────────────
  const depRate = overrides?.depreciationRatePercent != null
    ? overrides.depreciationRatePercent / 100
    : getDepreciationRate(make, year);
  const residualValueILS = purchasePrice * Math.pow(1 - depRate, holdingPeriodYears);
  const totalDepreciation = purchasePrice - residualValueILS;
  const annualDepreciationILS = totalDepreciation / holdingPeriodYears;
  const monthlyDepreciationILS = annualDepreciationILS / 12;

  // ── Insurance ─────────────────────────────────────────────────────────────
  const annualInsuranceCostILS = overrides?.insuranceILS
    ?? estimateInsurance(purchasePrice, year);
  const monthlyInsuranceCostILS = annualInsuranceCostILS / 12;

  // ── Totals ────────────────────────────────────────────────────────────────
  const annualTCO = annualDepreciationILS + annualFuelCostILS + annualMaintenanceCostILS + annualInsuranceCostILS;
  const monthlyTCO = annualTCO / 12;
  const totalHoldingCostILS = annualTCO * holdingPeriodYears;

  const officialKmPerLiter = officialFuelConsumption > 0
    ? Math.round((100 / officialFuelConsumption) * 10) / 10
    : 0;
  const realWorldKmPerLiter = realWorldFuelConsumption > 0
    ? Math.round((100 / realWorldFuelConsumption) * 10) / 10
    : 0;

  return {
    officialFuelConsumption,
    officialKmPerLiter,
    realWorldFuelConsumption: Math.round(realWorldFuelConsumption * 10) / 10,
    realWorldKmPerLiter,
    annualFuelCostILS: Math.round(annualFuelCostILS),
    monthlyFuelCostILS: Math.round(monthlyFuelCostILS),
    dataSource,
    annualMaintenanceCostILS: Math.round(annualMaintenanceCostILS),
    monthlyMaintenanceCostILS: Math.round(monthlyMaintenanceCostILS),
    annualInsuranceCostILS: Math.round(annualInsuranceCostILS),
    monthlyInsuranceCostILS: Math.round(monthlyInsuranceCostILS),
    depreciationRatePercent: Math.round(depRate * 100),
    annualDepreciationILS: Math.round(annualDepreciationILS),
    monthlyDepreciationILS: Math.round(monthlyDepreciationILS),
    residualValueILS: Math.round(residualValueILS),
    reliabilityScore,
    resaleScore,
    annualTCO: Math.round(annualTCO),
    monthlyTCO: Math.round(monthlyTCO),
    totalHoldingCostILS: Math.round(totalHoldingCostILS),
  };
}

export function formatILS(amount: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}
