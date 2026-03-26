export interface MakeOption {
  label: string;          // English display name (used as stored value)
  hebrewAliases: string[]; // Hebrew names returned by the Israeli Govt API
}

export const MAKES: MakeOption[] = [
  { label: "Toyota",      hebrewAliases: ["טויוטה"] },
  { label: "Hyundai",     hebrewAliases: ["יונדאי", "יונדאי ישראל"] },
  { label: "Kia",         hebrewAliases: ["קיה"] },
  { label: "Mazda",       hebrewAliases: ["מזדה", "מאזדה"] },
  { label: "Mitsubishi",  hebrewAliases: ["מיצובישי", "מיצובישי תאילנ"] },
  { label: "Honda",       hebrewAliases: ["הונדה"] },
  { label: "Volkswagen",  hebrewAliases: ["פולקסווגן"] },
  { label: "Skoda",       hebrewAliases: ["סקודה"] },
  { label: "SEAT",        hebrewAliases: ["סיאט"] },
  { label: "Ford",        hebrewAliases: ["פורד"] },
  { label: "Opel",        hebrewAliases: ["אופל"] },
  { label: "Renault",     hebrewAliases: ["רנו"] },
  { label: "Peugeot",     hebrewAliases: ["פיג'ו"] },
  { label: "Citroen",     hebrewAliases: ["סיטרואן"] },
  { label: "Fiat",        hebrewAliases: ["פיאט"] },
  { label: "BMW",         hebrewAliases: ["ב.מ.וו", "ב.מ.וו."] },
  { label: "Mercedes",    hebrewAliases: ["מרצדס", "מרצדס בנץ"] },
  { label: "Audi",        hebrewAliases: ["אאודי"] },
  { label: "Volvo",       hebrewAliases: ["וולוו"] },
  { label: "Lexus",       hebrewAliases: ["לקסוס"] },
  { label: "Subaru",      hebrewAliases: ["סובארו"] },
  { label: "Nissan",      hebrewAliases: ["ניסן"] },
  { label: "Suzuki",      hebrewAliases: ["סוזוקי"] },
  { label: "Dacia",       hebrewAliases: ["דאצ'יה"] },
  { label: "Jeep",        hebrewAliases: ["ג'יפ"] },
  { label: "Mini",        hebrewAliases: ["מיני"] },
  { label: "Alfa Romeo",  hebrewAliases: ["אלפא רומיאו"] },
  { label: "Chevrolet",   hebrewAliases: ["שברולט"] },
  { label: "Land Rover",  hebrewAliases: ["לנד רובר"] },
  { label: "Porsche",     hebrewAliases: ["פורשה"] },
  { label: "Cupra",       hebrewAliases: ["קופרה"] },
  { label: "DS",          hebrewAliases: ["די אס"] },
];

export const MODELS_BY_MAKE: Record<string, string[]> = {
  Toyota: [
    "Aygo X", "Yaris", "Yaris Cross", "Corolla", "Corolla Cross",
    "Auris", "C-HR", "RAV4", "Camry", "Prius", "Prius+",
    "Highlander", "Land Cruiser", "Hilux", "Proace City", "Avensis", "Verso",
  ],
  Hyundai: [
    "i10", "i20", "i30", "i30 N", "Elantra", "Sonata",
    "Kona", "Kona Electric", "Tucson", "Santa Fe", "Staria",
    "Ioniq", "Ioniq 5", "Ioniq 6",
  ],
  Kia: [
    "Picanto", "Rio", "Ceed", "XCeed", "ProCeed", "Stonic",
    "Niro", "Niro Electric", "Sportage", "Sorento", "Carnival",
    "EV6", "Stinger",
  ],
  Mazda: [
    "Mazda 2", "Mazda 3", "Mazda 6",
    "CX-3", "CX-30", "CX-5", "CX-60", "CX-90", "MX-30", "MX-5",
  ],
  Mitsubishi: [
    "Space Star", "Colt", "ASX", "Eclipse Cross", "Outlander",
    "L200", "Pajero Sport",
  ],
  Honda: [
    "Jazz", "Civic", "Civic Type R", "Accord",
    "HR-V", "CR-V", "ZR-V", "Honda e",
  ],
  Volkswagen: [
    "Polo", "Golf", "Golf GTI", "Golf GTE", "Golf R",
    "T-Cross", "T-Roc", "Tiguan", "Touareg",
    "Passat", "Arteon", "Caddy", "Transporter",
    "ID.3", "ID.4", "ID.5",
  ],
  Skoda: [
    "Fabia", "Scala", "Octavia", "Superb",
    "Kamiq", "Karoq", "Kodiaq", "Enyaq",
  ],
  SEAT: [
    "Ibiza", "Arona", "Leon", "Ateca",
    "Cupra Leon", "Cupra Formentor", "Cupra Born",
  ],
  Cupra: ["Born", "Leon", "Formentor", "Ateca"],
  Ford: [
    "Fiesta", "Puma", "Focus", "Mondeo",
    "Kuga", "Explorer", "Ranger", "Mustang", "Mustang Mach-E",
  ],
  Opel: [
    "Corsa", "Mokka", "Astra", "Insignia",
    "Crossland", "Grandland", "Corsa-e", "Mokka-e",
  ],
  Renault: [
    "Twingo", "Clio", "Megane", "Arkana", "Captur", "Kadjar",
    "Austral", "Zoe", "Megane E-Tech",
  ],
  Peugeot: [
    "108", "208", "308", "408", "508",
    "2008", "3008", "5008",
    "e-208", "e-2008",
  ],
  Citroen: [
    "C1", "C3", "C4", "C5", "C5 Aircross", "Berlingo",
    "e-C4",
  ],
  Fiat: [
    "500", "500e", "500X", "500L", "Panda", "Tipo",
  ],
  BMW: [
    "118i", "120i", "M135i",
    "218i", "220i", "M235i",
    "318i", "320i", "330i", "330e", "M3",
    "418i", "420i", "430i",
    "520i", "530i", "530e", "M5",
    "X1", "X2", "X3", "X4", "X5", "X6", "X7",
    "iX", "iX1", "iX3", "i4", "i5", "i7",
  ],
  Mercedes: [
    "A 180", "A 200", "A 250", "A 35 AMG", "A 45 AMG",
    "B 180", "B 200",
    "C 180", "C 200", "C 300", "C 43 AMG", "C 63 AMG",
    "E 200", "E 300", "E 400",
    "GLA 200", "GLA 250", "GLB 200", "GLC 200", "GLC 300", "GLE 350",
    "CLA 200", "CLA 250",
    "S 400", "S 500",
    "EQA", "EQB", "EQC", "EQS",
  ],
  Audi: [
    "A1", "A3", "A4", "A5", "A6", "A7", "A8",
    "Q2", "Q3", "Q5", "Q7", "Q8",
    "TT", "R8", "RS3", "RS6",
    "Q4 e-tron", "e-tron GT",
  ],
  Volvo: [
    "XC40", "XC60", "XC90",
    "S60", "S90", "V60", "V90",
    "C40",
  ],
  Lexus: [
    "UX", "UX 300e", "NX", "RX", "RX 450h+",
    "IS", "ES", "GS", "LS", "LC",
  ],
  Subaru: [
    "Impreza", "Legacy", "Outback", "Forester",
    "XV", "Crosstrek", "BRZ", "WRX", "Levorg", "Solterra",
  ],
  Nissan: [
    "Micra", "Juke", "Qashqai", "X-Trail",
    "Pathfinder", "Navara", "Leaf", "Ariya",
  ],
  Suzuki: [
    "Alto", "Baleno", "Swift", "Ignis", "Vitara", "S-Cross", "Jimny",
  ],
  Dacia: [
    "Sandero", "Duster", "Logan", "Jogger", "Spring",
  ],
  Jeep: [
    "Renegade", "Compass", "Cherokee", "Grand Cherokee",
    "Wrangler", "Gladiator", "Avenger",
  ],
  Mini: [
    "Cooper", "Cooper S", "Cooper SE", "John Cooper Works",
    "Clubman", "Countryman", "Paceman",
  ],
  "Alfa Romeo": [
    "Giulia", "Stelvio", "Tonale", "Giulietta", "Mito",
  ],
  Chevrolet: [
    "Spark", "Sonic", "Cruze", "Malibu", "Trax", "Equinox",
  ],
  "Land Rover": [
    "Defender", "Discovery", "Discovery Sport", "Range Rover",
    "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque",
  ],
  Porsche: [
    "911", "Cayenne", "Macan", "Panamera", "Taycan",
  ],
  DS: [
    "DS 3", "DS 3 Crossback", "DS 4", "DS 7", "DS 9",
  ],
};

/**
 * Converts a raw make name from the Israeli Govt API (Hebrew or English)
 * into the English display label used in our catalog.
 */
export function resolveDisplayMake(raw: string): string {
  const trimmed = raw.trim();

  // Exact Hebrew match
  for (const make of MAKES) {
    if (make.hebrewAliases.includes(trimmed)) return make.label;
  }

  // Partial Hebrew prefix match (API sometimes truncates, e.g. "מיצובישי תאילנ")
  for (const make of MAKES) {
    for (const alias of make.hebrewAliases) {
      if (trimmed.startsWith(alias.substring(0, 4)) || alias.startsWith(trimmed.substring(0, 4))) {
        return make.label;
      }
    }
  }

  // English case-insensitive match
  const lower = trimmed.toLowerCase();
  const engMatch = MAKES.find((m) => m.label.toLowerCase() === lower);
  if (engMatch) return engMatch.label;

  return trimmed; // fallback: return as-is
}
