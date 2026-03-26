"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus, X, Fuel, Wrench, TrendingDown, RefreshCw,
  Loader2, Search, AlertCircle, ChevronDown, ChevronUp,
  Pencil, Check, RotateCcw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import SearchSelect, { type SelectOption } from "@/components/SearchSelect";
import { calculateTCO, formatILS, type CarInput, type TCOResult, type TCOOverrides } from "@/lib/tco";
import { MAKES, MODELS_BY_MAKE, resolveDisplayMake } from "@/lib/carCatalog";

// ── Option lists ──────────────────────────────────────────────────────────────
const MAKE_OPTIONS: SelectOption[] = MAKES.map((m) => ({
  value: m.label,
  label: m.label,
  searchTerms: m.hebrewAliases.join(" "),
}));
function modelOptions(make: string): SelectOption[] {
  return (MODELS_BY_MAKE[make] ?? []).map((m) => ({ value: m, label: m }));
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Estimates {
  maintenanceILS: number;
  depreciationRatePercent: number;
  realWorldKmL: number;
}

interface CarEntry {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  engineSize: number | null;
  fuelType: string;
  purchasePrice: number;
  annualMileageKm: number;
  holdingPeriodYears: number;
  // Two-step state
  estimates: Estimates | null;   // set after first "Calculate" click
  overrides: Partial<TCOOverrides>; // manual values; empty = use estimates
  tco: TCOResult | null;         // set after "Apply & Calculate"
  // Plate lookup
  loadingPlate: boolean;
  plateError: string;
}

const DEFAULT_CAR: Omit<CarEntry, "id"> = {
  plate: "", make: "", model: "",
  year: new Date().getFullYear(),
  trim: "", engineSize: null, fuelType: "בנזין",
  purchasePrice: 0, annualMileageKm: 0, holdingPeriodYears: 5,
  estimates: null, overrides: {}, tco: null,
  loadingPlate: false, plateError: "",
};

function newCar(overrides: Partial<CarEntry> = {}): CarEntry {
  return { ...DEFAULT_CAR, id: Math.random().toString(36).slice(2), ...overrides };
}

function isReady(car: CarEntry): boolean {
  return (
    car.make.trim() !== "" && car.model.trim() !== "" &&
    car.year > 1990 && car.purchasePrice > 0 && car.annualMileageKm > 0
  );
}

function toInput(car: CarEntry): CarInput {
  return {
    make: car.make, model: car.model, year: car.year,
    engineSize: car.engineSize, fuelType: car.fuelType,
    purchasePrice: car.purchasePrice, annualMileageKm: car.annualMileageKm,
    holdingPeriodYears: car.holdingPeriodYears,
  };
}

// ── ScoreBar ──────────────────────────────────────────────────────────────────
function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-400 text-xs">{label}</span>
        <span className="text-white text-xs font-semibold">{score}/10</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── EstimateRow — one editable row in the assumptions section ─────────────────
function EstimateRow({
  label, estimatedDisplay, unit,
  manualValue, onSave, onReset,
}: {
  label: string;
  estimatedDisplay: string;
  unit: string;
  manualValue: string | null;   // null = not overridden
  onSave: (val: string) => void;
  onReset: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");

  const isOverridden = manualValue !== null;
  const displayedValue = isOverridden ? `${manualValue} ${unit}` : estimatedDisplay;

  const handleEdit = () => {
    setInput(isOverridden ? manualValue! : "");
    setEditing(true);
  };

  const handleSave = () => {
    const num = parseFloat(input.replace(/,/g, ""));
    if (!isNaN(num) && num > 0) {
      onSave(String(num));
      setEditing(false);
    }
  };

  const handleReset = () => {
    onReset();
    setEditing(false);
  };

  return (
    <div className={`rounded-xl p-3.5 border transition-colors ${
      isOverridden
        ? "bg-blue-500/10 border-blue-500/30"
        : "bg-white/5 border-white/10"
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-slate-400 text-xs font-medium mb-0.5">{label}</p>
          {editing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setEditing(false);
                }}
                placeholder={`Enter ${unit}`}
                className="w-28 bg-white/10 border border-blue-500/50 text-white placeholder-slate-500 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-xs">{unit}</span>
              <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                <Check size={15} />
              </button>
              <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
          ) : (
            <p className={`text-base font-bold ${isOverridden ? "text-blue-300" : "text-white"}`}>
              {displayedValue}
              {isOverridden && (
                <span className="text-xs text-slate-500 font-normal ml-1.5">
                  (est. {estimatedDisplay})
                </span>
              )}
            </p>
          )}
        </div>

        {!editing && (
          <div className="flex items-center gap-1.5 shrink-0">
            {isOverridden && (
              <button
                onClick={handleReset}
                title="Reset to estimate"
                className="text-slate-500 hover:text-yellow-400 transition-colors"
              >
                <RotateCcw size={13} />
              </button>
            )}
            <button
              onClick={handleEdit}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1 transition-colors"
            >
              <Pencil size={11} />
              {isOverridden ? "Edit" : "Enter manually"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CarCard ───────────────────────────────────────────────────────────────────
function CarCard({
  car, index, onUpdate, onRemove, canRemove,
}: {
  car: CarEntry;
  index: number;
  onUpdate: (id: string, updates: Partial<CarEntry>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  const [showInputs, setShowInputs] = useState(true);
  const [plateInput, setPlateInput] = useState(car.plate);

  // ── Plate lookup ────────────────────────────────────────────────────────────
  const lookupPlate = async () => {
    if (!plateInput.trim()) return;
    onUpdate(car.id, { loadingPlate: true, plateError: "" });
    try {
      const res = await fetch(`/api/car?plate=${encodeURIComponent(plateInput.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        onUpdate(car.id, { loadingPlate: false, plateError: data.error ?? "Not found" });
        return;
      }
      onUpdate(car.id, {
        loadingPlate: false, plate: plateInput,
        make: resolveDisplayMake(data.make), model: data.model,
        year: data.year, trim: data.trim,
        engineSize: data.engineSize, fuelType: data.fuelType,
        plateError: "", estimates: null, tco: null,
      });
    } catch {
      onUpdate(car.id, { loadingPlate: false, plateError: "Network error" });
    }
  };

  // ── Step 1: compute estimates ────────────────────────────────────────────────
  const handleEstimate = () => {
    if (!isReady(car)) return;
    const base = calculateTCO(toInput(car));
    onUpdate(car.id, {
      estimates: {
        maintenanceILS: base.annualMaintenanceCostILS,
        depreciationRatePercent: base.depreciationRatePercent,
        realWorldKmL: base.realWorldKmPerLiter,
      },
      overrides: {},
      tco: null,
    });
    setShowInputs(false); // collapse inputs, scroll to estimates
  };

  // ── Step 2: apply overrides + compute full TCO ───────────────────────────────
  const handleApply = () => {
    if (!isReady(car) || !car.estimates) return;
    const ov: TCOOverrides = {};
    if (car.overrides.maintenanceILS != null)       ov.maintenanceILS = car.overrides.maintenanceILS;
    if (car.overrides.depreciationRatePercent != null) ov.depreciationRatePercent = car.overrides.depreciationRatePercent;
    if (car.overrides.realWorldKmL != null)         ov.realWorldKmL = car.overrides.realWorldKmL;
    onUpdate(car.id, { tco: calculateTCO(toInput(car), ov) });
  };

  const setOverride = (key: keyof TCOOverrides, val: string | null) => {
    const num = val != null ? parseFloat(val) : undefined;
    onUpdate(car.id, {
      overrides: { ...car.overrides, [key]: num },
      tco: null, // invalidate result when an override changes
    });
  };

  const clearOverride = (key: keyof TCOOverrides) => {
    const next = { ...car.overrides };
    delete next[key];
    onUpdate(car.id, { overrides: next, tco: null });
  };

  const ready = isReady(car);
  const missingFields = [
    !car.make && "Make", !car.model && "Model",
    (!car.year || car.year <= 1990) && "Year",
    !car.purchasePrice && "Purchase Price",
    !car.annualMileageKm && "Annual Mileage",
  ].filter(Boolean) as string[];

  const carTitle = car.make && car.model
    ? `${car.year} ${car.make} ${car.model}`
    : `Car ${index + 1}`;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <h3 className="text-white font-semibold text-sm truncate pr-2">{carTitle}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowInputs((v) => !v)} className="text-slate-400 hover:text-white">
            {showInputs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {canRemove && (
            <button onClick={() => onRemove(car.id)} className="text-slate-500 hover:text-red-400 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Inputs ─────────────────────────────────────────────────────────── */}
      {showInputs && (
        <div className="p-5 space-y-4">
          {/* Plate */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">
              License Plate <span className="text-slate-600">(optional auto-fill)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={plateInput}
                onChange={(e) => setPlateInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookupPlate()}
                placeholder="123-45-678"
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={lookupPlate} disabled={car.loadingPlate}
                className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 rounded-lg px-3 py-2 transition-colors"
              >
                {car.loadingPlate ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </button>
            </div>
            {car.plateError && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {car.plateError}
              </p>
            )}
          </div>

          {/* Make / Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1">
                Make <span className="text-red-400">*</span>
              </label>
              <SearchSelect
                value={car.make}
                onChange={(v) => onUpdate(car.id, { make: v, model: "", estimates: null, tco: null })}
                options={MAKE_OPTIONS}
                placeholder="Toyota, טויוטה…"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1">
                Model <span className="text-red-400">*</span>
              </label>
              <SearchSelect
                value={car.model}
                onChange={(v) => onUpdate(car.id, { model: v, estimates: null, tco: null })}
                options={modelOptions(car.make)}
                placeholder={car.make ? "Select model" : "Select make first"}
                disabled={!car.make}
              />
            </div>
          </div>

          {/* Year / Engine */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1">
                Year <span className="text-red-400">*</span>
              </label>
              <input
                type="number" min="1990" max={new Date().getFullYear() + 1}
                value={car.year || ""} placeholder="2022"
                onChange={(e) => onUpdate(car.id, { year: parseInt(e.target.value) || 0, estimates: null, tco: null })}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1">Engine (L)</label>
              <input
                type="number" step="0.1" min="0"
                value={car.engineSize ?? ""} placeholder="1.6"
                onChange={(e) => onUpdate(car.id, { engineSize: e.target.value ? parseFloat(e.target.value) : null, estimates: null, tco: null })}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Financial */}
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1">
                Purchase Price (&#8362;) <span className="text-red-400">*</span>
              </label>
              <input
                type="number" step="1000" min="0"
                value={car.purchasePrice || ""} placeholder="120,000"
                onChange={(e) => onUpdate(car.id, { purchasePrice: parseInt(e.target.value) || 0, estimates: null, tco: null })}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1">
                Annual Mileage (km) <span className="text-red-400">*</span>
              </label>
              <input
                type="number" step="1000" min="0"
                value={car.annualMileageKm || ""} placeholder="15,000"
                onChange={(e) => onUpdate(car.id, { annualMileageKm: parseInt(e.target.value) || 0, estimates: null, tco: null })}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1">Holding Period (years)</label>
              <input
                type="number" min="1" max="15"
                value={car.holdingPeriodYears}
                onChange={(e) => onUpdate(car.id, { holdingPeriodYears: parseInt(e.target.value) || 1, estimates: null, tco: null })}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Step 1 button */}
          <button
            onClick={handleEstimate} disabled={!ready}
            title={ready ? undefined : `Fill required fields: ${missingFields.join(", ")}`}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            <RefreshCw size={14} />
            Calculate TCO
          </button>
          {!ready && missingFields.length > 0 && (
            <p className="text-slate-500 text-xs -mt-1">Required: {missingFields.join(", ")}</p>
          )}
        </div>
      )}

      {/* ── Step 2: Editable Estimates ─────────────────────────────────────── */}
      {car.estimates && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-white text-sm font-semibold">Key Assumptions</h4>
            <span className="text-slate-500 text-xs">Override any value before calculating</span>
          </div>

          <EstimateRow
            label="Maintenance / yr"
            estimatedDisplay={formatILS(car.estimates.maintenanceILS)}
            unit="₪/yr"
            manualValue={car.overrides.maintenanceILS != null ? String(car.overrides.maintenanceILS) : null}
            onSave={(v) => setOverride("maintenanceILS", v)}
            onReset={() => clearOverride("maintenanceILS")}
          />

          <EstimateRow
            label="Depreciation / yr"
            estimatedDisplay={`${car.estimates.depreciationRatePercent}%`}
            unit="%/yr"
            manualValue={car.overrides.depreciationRatePercent != null ? String(car.overrides.depreciationRatePercent) : null}
            onSave={(v) => setOverride("depreciationRatePercent", v)}
            onReset={() => clearOverride("depreciationRatePercent")}
          />

          <EstimateRow
            label="Real-world fuel efficiency"
            estimatedDisplay={`${car.estimates.realWorldKmL} km/L`}
            unit="km/L"
            manualValue={car.overrides.realWorldKmL != null ? String(car.overrides.realWorldKmL) : null}
            onSave={(v) => setOverride("realWorldKmL", v)}
            onReset={() => clearOverride("realWorldKmL")}
          />

          <button
            onClick={handleApply}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors mt-1"
          >
            <Check size={14} />
            {car.tco ? "Recalculate TCO" : "Apply & Calculate TCO"}
          </button>
        </div>
      )}

      {/* ── TCO Results ───────────────────────────────────────────────────── */}
      {car.tco && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white text-sm font-semibold">Results</h4>
            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
              car.tco.dataSource === "model-specific"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
            }`}>
              {car.tco.dataSource === "model-specific" ? "Model-specific data" : "Engine estimate"}
            </span>
          </div>

          {/* Monthly / Annual hero */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
              <div className="text-slate-400 text-xs mb-1">Monthly TCO</div>
              <div className="text-blue-400 text-xl font-bold">{formatILS(car.tco.monthlyTCO)}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-slate-400 text-xs mb-1">Annual TCO</div>
              <div className="text-white text-xl font-bold">{formatILS(car.tco.annualTCO)}</div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 flex items-center gap-1.5">
                <TrendingDown size={13} className="text-orange-400" /> Depreciation / yr
              </span>
              <span className="text-orange-400 font-medium flex items-center gap-1">
                {car.tco.depreciationRatePercent}%
                {car.overrides.depreciationRatePercent != null && <Pencil size={10} className="text-blue-400" />}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Fuel size={13} className="text-yellow-400" /> Fuel / yr
              </span>
              <span className="text-white font-medium">{formatILS(car.tco.annualFuelCostILS)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Wrench size={13} className="text-blue-400" /> Maintenance / yr
              </span>
              <span className="text-white font-medium flex items-center gap-1">
                {formatILS(car.tco.annualMaintenanceCostILS)}
                {car.overrides.maintenanceILS != null && <Pencil size={10} className="text-blue-400" />}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Residual value</span>
              <span className="text-emerald-400 font-medium">{formatILS(car.tco.residualValueILS)}</span>
            </div>
            {car.tco.officialKmPerLiter > 0 ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Official fuel (mfr.)</span>
                  <span className="text-white">{car.tco.officialKmPerLiter} km/L</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Real-world fuel efficiency</span>
                  <span className="text-yellow-400 flex items-center gap-1">
                    {car.tco.realWorldKmPerLiter} km/L
                    {car.overrides.realWorldKmL != null && <Pencil size={10} className="text-blue-400" />}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Fuel type</span>
                <span className="text-emerald-400">Electric</span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <ScoreBar score={car.tco.reliabilityScore} label="Reliability (IL)" />
            <ScoreBar score={car.tco.resaleScore} label="Resale Value (IL)" />
          </div>

          <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400 text-sm">Total {car.holdingPeriodYears}yr cost</span>
            <span className="text-white font-bold">{formatILS(car.tco.totalHoldingCostILS)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function ComparePageInner() {
  const searchParams = useSearchParams();

  const initialCar = newCar({
    plate: searchParams.get("plate") ?? "",
    make: resolveDisplayMake(searchParams.get("make") ?? ""),
    model: searchParams.get("model") ?? "",
    year: parseInt(searchParams.get("year") ?? "0") || new Date().getFullYear(),
    trim: searchParams.get("trim") ?? "",
    engineSize: searchParams.get("engineSize") ? parseFloat(searchParams.get("engineSize")!) : null,
    fuelType: searchParams.get("fuelType") ?? "בנזין",
  });

  const [cars, setCars] = useState<CarEntry[]>([initialCar]);

  const updateCar = (id: string, updates: Partial<CarEntry>) =>
    setCars((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  const removeCar = (id: string) =>
    setCars((prev) => prev.filter((c) => c.id !== id));
  const addCar = () => {
    if (cars.length >= 3) return;
    const first = cars[0];
    setCars((prev) => [...prev, newCar({ annualMileageKm: first.annualMileageKm, holdingPeriodYears: first.holdingPeriodYears })]);
  };

  const allHaveTCO = cars.length > 1 && cars.every((c) => c.tco !== null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">TCO Comparison</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Compare up to 3 vehicles — Total Cost of Ownership in &#8362;
            </p>
          </div>
          {cars.length < 3 && (
            <button
              onClick={addCar}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl px-4 py-2 text-sm transition-colors"
            >
              <Plus size={15} /> Add Car
            </button>
          )}
        </div>

        <div className={`grid gap-4 ${
          cars.length === 1 ? "grid-cols-1 max-w-md"
          : cars.length === 2 ? "grid-cols-1 md:grid-cols-2"
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}>
          {cars.map((car, i) => (
            <CarCard key={car.id} car={car} index={i}
              onUpdate={updateCar} onRemove={removeCar} canRemove={cars.length > 1} />
          ))}
        </div>

        {/* Summary table */}
        {allHaveTCO && (
          <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Side-by-Side Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase tracking-wider">
                    <th className="text-left pb-3 font-medium">Metric</th>
                    {cars.map((c, i) => (
                      <th key={c.id} className="text-right pb-3 font-medium">
                        {c.make ? `${c.make} ${c.model}` : `Car ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(
                    [
                      { label: "Monthly TCO",           key: "monthlyTCO",               fmt: formatILS,                                bestIsMin: true  },
                      { label: "Annual TCO",             key: "annualTCO",                fmt: formatILS,                                bestIsMin: true  },
                      { label: "Depreciation / yr",      key: "depreciationRatePercent",  fmt: (v: number) => `${v}%`,                   bestIsMin: true  },
                      { label: "Fuel / yr",              key: "annualFuelCostILS",        fmt: formatILS,                                bestIsMin: true  },
                      { label: "Maintenance / yr",       key: "annualMaintenanceCostILS", fmt: formatILS,                                bestIsMin: true  },
                      { label: "Official fuel",          key: "officialKmPerLiter",       fmt: (v: number) => v > 0 ? `${v} km/L` : "EV", bestIsMin: false },
                      { label: "Real-world fuel eff.",   key: "realWorldKmPerLiter",      fmt: (v: number) => v > 0 ? `${v} km/L` : "EV", bestIsMin: false },
                      { label: "Residual value",         key: "residualValueILS",         fmt: formatILS,                                bestIsMin: false },
                      { label: "Reliability",            key: "reliabilityScore",         fmt: (v: number) => `${v}/10`,                 bestIsMin: false },
                      { label: "Resale Score",           key: "resaleScore",              fmt: (v: number) => `${v}/10`,                 bestIsMin: false },
                    ] as { label: string; key: keyof TCOResult; fmt: (v: number) => string; bestIsMin: boolean }[]
                  ).map(({ label, key, fmt, bestIsMin }) => {
                    const values = cars.map((c) => c.tco![key] as number);
                    const best = bestIsMin ? Math.min(...values) : Math.max(...values);
                    return (
                      <tr key={key}>
                        <td className="py-2.5 text-slate-400">{label}</td>
                        {values.map((v, i) => (
                          <td key={cars[i].id}
                            className={`py-2.5 text-right font-medium ${v === best ? "text-emerald-400" : "text-white"}`}>
                            {fmt(v)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-slate-600 text-xs mt-4">Green = best value in each row.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="text-blue-400 animate-spin" size={32} />
      </div>
    }>
      <ComparePageInner />
    </Suspense>
  );
}
