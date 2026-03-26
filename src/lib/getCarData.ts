const GOV_API_BASE = "https://data.gov.il/api/3/action/datastore_search";
// Correct resource: "מאגר מספרי רישוי של כלי רכב" (private & commercial vehicles)
const RESOURCE_ID = "053cea08-09bc-40ec-8f7a-156f0677aff3";

export interface CarData {
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  engineSize: number | null; // liters — estimated from engine code
  fuelType: string;
  color: string;
  rawData: Record<string, unknown>;
}

interface GovApiRecord {
  mispar_rechev?: string | number;
  tozeret_nm?: string;       // manufacturer name (Hebrew)
  kinuy_mishari?: string;    // commercial name / model
  degem_nm?: string;         // model code (e.g. "XTA03")
  ramat_gimur?: string;      // trim level (e.g. "INSTYLE")
  shnat_yitzur?: string | number; // production year
  degem_manoa?: string;      // engine code (e.g. "3A92") — no cc field in this dataset
  sug_delek_nm?: string;     // fuel type (Hebrew)
  tzeva_rechev?: string;     // color (Hebrew)
  [key: string]: unknown;
}

interface GovApiResponse {
  success: boolean;
  result: {
    records: GovApiRecord[];
    total: number;
  };
}

/**
 * Rough engine displacement estimate from manufacturer engine codes.
 * The API has no cc field — this is best-effort.
 */
function estimateEngineFromCode(code: string | undefined): number | null {
  if (!code) return null;
  const c = code.toUpperCase();

  // Common Mitsubishi codes
  if (c === "3A92") return 1.2;
  if (c === "4A91") return 1.3;
  if (c === "4B10" || c === "4B11") return 2.0;
  if (c === "4B12") return 2.4;
  if (c === "4N14") return 2.2;
  if (c === "4G15") return 1.5;
  if (c === "4G93") return 1.8;
  if (c === "4G63" || c === "4G64") return 2.0;

  // Toyota/Lexus
  if (c === "1NR" || c.startsWith("1NR")) return 1.3;
  if (c === "2NR" || c.startsWith("2NR")) return 1.5;
  if (c === "1ZR" || c.startsWith("1ZR")) return 1.6;
  if (c === "2ZR" || c.startsWith("2ZR")) return 1.8;
  if (c === "3ZR" || c.startsWith("3ZR")) return 2.0;
  if (c.startsWith("2AR")) return 2.5;
  if (c.startsWith("2GR")) return 3.5;

  // VW/Audi/Skoda/Seat
  if (c.startsWith("CHY") || c.startsWith("CHYA")) return 1.0;
  if (c.startsWith("CJZ") || c.startsWith("CJZA")) return 1.2;
  if (c.startsWith("CZE") || c.startsWith("CZEA")) return 1.4;
  if (c.startsWith("CPT") || c.startsWith("CPTA")) return 1.4;
  if (c.startsWith("EA2")) return 1.5;

  // Hyundai/Kia
  if (c === "G4LA") return 1.0;
  if (c === "G4LC") return 1.0;
  if (c === "G4LE") return 1.4;
  if (c === "G4LH") return 1.6;
  if (c === "G4NA" || c === "G4NB") return 2.0;
  if (c === "G4KD") return 2.0;
  if (c === "G4KE") return 2.4;

  // Ford
  if (c.startsWith("M1DA") || c.startsWith("M2DA")) return 1.5;
  if (c.startsWith("IQJA")) return 1.0;

  // Mazda
  if (c.startsWith("P3") || c.startsWith("P5")) return 1.5;
  if (c.startsWith("L3")) return 2.3;
  if (c.startsWith("L5")) return 2.5;

  return null;
}

export async function getCarData(licensePlate: string): Promise<CarData> {
  const normalized = licensePlate.replace(/[-\s]/g, "").trim();
  const plateNum = parseInt(normalized, 10);

  // Use filters for exact match (more reliable than q= full-text search)
  const params = new URLSearchParams({
    resource_id: RESOURCE_ID,
    filters: JSON.stringify({ mispar_rechev: isNaN(plateNum) ? normalized : plateNum }),
    limit: "1",
  });

  const res = await fetch(`${GOV_API_BASE}?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  const json: GovApiResponse = await res.json();

  if (!json.success || !json.result?.records?.length) {
    throw new Error(`No vehicle found for license plate: ${normalized}`);
  }

  const record = json.result.records[0];

  return {
    licensePlate: normalized,
    make: String(record.tozeret_nm ?? "").trim(),
    model: String(record.kinuy_mishari ?? record.degem_nm ?? "").trim(),
    year: parseInt(String(record.shnat_yitzur ?? "0"), 10),
    trim: String(record.ramat_gimur ?? "").trim(),
    engineSize: estimateEngineFromCode(record.degem_manoa as string | undefined),
    fuelType: String(record.sug_delek_nm ?? "").trim(),
    color: String(record.tzeva_rechev ?? "").trim(),
    rawData: record as Record<string, unknown>,
  };
}
