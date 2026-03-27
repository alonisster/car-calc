"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus, X, Fuel, Wrench, TrendingDown, RefreshCw,
  Loader2, Search, AlertCircle, ChevronDown, ChevronUp,
  Pencil, Check, RotateCcw, Car, ShieldCheck, Save, FolderOpen,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import SearchSelect, { type SelectOption } from "@/components/SearchSelect";
import { calculateTCO, estimateInsurance, formatILS, type CarInput, type TCOResult, type TCOOverrides } from "@/lib/tco";
import { MAKES, MODELS_BY_MAKE, resolveDisplayMake } from "@/lib/carCatalog";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/contexts/LanguageContext";

// ── Option lists ──────────────────────────────────────────────────────────────
const MAKE_OPTIONS: SelectOption[] = MAKES.map((m) => ({
  value: m.label, label: m.label, searchTerms: m.hebrewAliases.join(" "),
}));
function modelOptions(make: string): SelectOption[] {
  return (MODELS_BY_MAKE[make] ?? []).map((m) => ({ value: m, label: m }));
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Estimates {
  maintenanceILS: number;
  depreciationRatePercent: number;
  realWorldKmL: number;
  fuelPricePerLiter: number;
  insuranceILS: number;
}
interface CarEntry {
  id: string;
  plate: string; make: string; model: string; year: number;
  trim: string; engineSize: number | null; fuelType: string;
  purchasePrice: number; annualMileageKm: number; holdingPeriodYears: number;
  estimates: Estimates | null;
  overrides: Partial<TCOOverrides>;
  tco: TCOResult | null;
  loadingPlate: boolean; plateError: string;
}

const DEFAULT_CAR: Omit<CarEntry, "id"> = {
  plate: "", make: "", model: "", year: new Date().getFullYear(),
  trim: "", engineSize: null, fuelType: "בנזין",
  purchasePrice: 0, annualMileageKm: 0, holdingPeriodYears: 5,
  estimates: null, overrides: {}, tco: null,
  loadingPlate: false, plateError: "",
};
function newCar(ov: Partial<CarEntry> = {}): CarEntry {
  return { ...DEFAULT_CAR, id: Math.random().toString(36).slice(2), ...ov };
}
function isReady(c: CarEntry) {
  return c.make.trim() !== "" && c.model.trim() !== "" && c.year > 1990 && c.purchasePrice > 0 && c.annualMileageKm > 0;
}
function toInput(c: CarEntry): CarInput {
  return { make: c.make, model: c.model, year: c.year, engineSize: c.engineSize, fuelType: c.fuelType, purchasePrice: c.purchasePrice, annualMileageKm: c.annualMileageKm, holdingPeriodYears: c.holdingPeriodYears };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const CARD_ACCENTS = [
  { from: "#2563eb", to: "#7c3aed" },
  { from: "#0891b2", to: "#059669" },
  { from: "#d97706", to: "#dc2626" },
];

// ── ScoreBar ──────────────────────────────────────────────────────────────────
function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = (score / 10) * 100;
  const gradient = score >= 8
    ? "linear-gradient(90deg,#10b981,#34d399)"
    : score >= 6
    ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
    : "linear-gradient(90deg,#ef4444,#f87171)";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-slate-500 text-xs">{label}</span>
        <span className="text-white text-xs font-bold tabular-nums">{score}<span className="text-slate-600">/10</span></span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: gradient }} />
      </div>
    </div>
  );
}

// ── CostBar — proportional waterfall breakdown ────────────────────────────────
function CostBreakdown({ tco }: { tco: TCOResult }) {
  const { t } = useLang();
  const total = tco.annualDepreciationILS + tco.annualFuelCostILS + tco.annualMaintenanceCostILS + tco.annualInsuranceCostILS;
  const items = [
    { label: t("depreciationRow"), value: tco.annualDepreciationILS,    color: "#f97316", icon: TrendingDown },
    { label: t("fuelRow"),         value: tco.annualFuelCostILS,        color: "#eab308", icon: Fuel },
    { label: t("maintenanceRow"),  value: tco.annualMaintenanceCostILS, color: "#3b82f6", icon: Wrench },
    { label: t("insuranceRow"),    value: tco.annualInsuranceCostILS,   color: "#a78bfa", icon: ShieldCheck },
  ];
  return (
    <div className="space-y-2">
      {items.map(({ label, value, color, icon: Icon }) => {
        const pct = total > 0 ? (value / total) * 100 : 0;
        return (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Icon size={12} style={{ color }} />
                {label}
                <span className="text-slate-600">({Math.round(pct)}%)</span>
              </span>
              <span className="text-white text-xs font-semibold tabular-nums">{formatILS(value)}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── EstimateRow ───────────────────────────────────────────────────────────────
function EstimateRow({
  icon: Icon, iconColor, label, estimatedDisplay, unit,
  manualValue, onSave, onReset,
}: {
  icon: React.ElementType; iconColor: string;
  label: string; estimatedDisplay: string; unit: string;
  manualValue: string | null;
  onSave: (v: string) => void; onReset: () => void;
}) {
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const isOverridden = manualValue !== null;

  const handleSave = () => {
    const n = parseFloat(input.replace(/,/g, ""));
    if (!isNaN(n) && n > 0) { onSave(String(n)); setEditing(false); }
  };

  return (
    <div className="rounded-xl p-4 transition-all"
      style={{
        background: isOverridden ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isOverridden ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.07)"}`,
      }}>
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${iconColor}15` }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-slate-500 text-xs mb-0.5">{label}</p>
          {editing ? (
            <div className="flex items-center gap-2 mt-1">
              <input type="number" autoFocus value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
                placeholder={`Enter ${unit}`}
                className="w-28 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(59,130,246,0.5)" }} />
              <span className="text-slate-500 text-xs">{unit}</span>
              <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300 transition-colors"><Check size={14} /></button>
              <button onClick={() => setEditing(false)} className="text-slate-600 hover:text-white transition-colors"><X size={13} /></button>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <p className="text-white font-bold text-base" style={{ color: isOverridden ? "#93c5fd" : "#fff" }}>
                {isOverridden ? `${manualValue} ${unit}` : estimatedDisplay}
              </p>
              {isOverridden && (
                <span className="text-slate-600 text-xs">{t("est")} {estimatedDisplay}</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!editing && (
          <div className="flex items-center gap-1.5 shrink-0">
            {isOverridden && (
              <button onClick={onReset} title="Reset to estimate"
                className="p-1.5 rounded-lg text-slate-600 hover:text-amber-400 hover:bg-amber-400/10 transition-all">
                <RotateCcw size={12} />
              </button>
            )}
            <button onClick={() => { setInput(isOverridden ? manualValue! : ""); setEditing(true); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#94a3b8",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}>
              <Pencil size={11} />
              {isOverridden ? t("editBtn") : t("enterManually")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared input field ────────────────────────────────────────────────────────
function Field({ label, required: req, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
        {label}{req && <span className="text-blue-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── CarCard ───────────────────────────────────────────────────────────────────
function CarCard({ car, index, onUpdate, onRemove, canRemove, fuelPrices }: {
  car: CarEntry; index: number;
  onUpdate: (id: string, updates: Partial<CarEntry>) => void;
  onRemove: (id: string) => void; canRemove: boolean;
  fuelPrices: { petrol: number; diesel: number };
}) {
  const { t } = useLang();
  const [showInputs, setShowInputs] = useState(true);
  const [plateInput, setPlateInput] = useState(car.plate);
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

  const lookupPlate = async () => {
    if (!plateInput.trim()) return;
    onUpdate(car.id, { loadingPlate: true, plateError: "" });
    try {
      const res = await fetch(`/api/car?plate=${encodeURIComponent(plateInput.trim())}`);
      const data = await res.json();
      if (!res.ok) { onUpdate(car.id, { loadingPlate: false, plateError: data.error ?? t("notFound") }); return; }
      onUpdate(car.id, {
        loadingPlate: false, plate: plateInput, make: resolveDisplayMake(data.make),
        model: data.model, year: data.year, trim: data.trim,
        engineSize: data.engineSize, fuelType: data.fuelType,
        plateError: "", estimates: null, tco: null,
      });
    } catch { onUpdate(car.id, { loadingPlate: false, plateError: t("networkError") }); }
  };

  const handleEstimate = () => {
    if (!isReady(car)) return;
    const isDiesel = car.fuelType.toLowerCase().includes("סולר") || car.fuelType.toLowerCase().includes("diesel");
    const liveFuelPrice = isDiesel ? fuelPrices.diesel : fuelPrices.petrol;
    const base = calculateTCO(toInput(car), { fuelPricePerLiter: liveFuelPrice });
    onUpdate(car.id, {
      estimates: {
        maintenanceILS: base.annualMaintenanceCostILS,
        depreciationRatePercent: base.depreciationRatePercent,
        realWorldKmL: base.realWorldKmPerLiter,
        fuelPricePerLiter: liveFuelPrice,
        insuranceILS: estimateInsurance(car.purchasePrice, car.year),
      },
      overrides: {}, tco: null,
    });
    setShowInputs(false);
  };

  const handleApply = () => {
    if (!isReady(car) || !car.estimates) return;
    const ov: TCOOverrides = {
      fuelPricePerLiter: car.overrides.fuelPricePerLiter ?? car.estimates.fuelPricePerLiter,
      insuranceILS: car.overrides.insuranceILS ?? car.estimates.insuranceILS,
    };
    if (car.overrides.maintenanceILS != null) ov.maintenanceILS = car.overrides.maintenanceILS;
    if (car.overrides.depreciationRatePercent != null) ov.depreciationRatePercent = car.overrides.depreciationRatePercent;
    if (car.overrides.realWorldKmL != null) ov.realWorldKmL = car.overrides.realWorldKmL;
    onUpdate(car.id, { tco: calculateTCO(toInput(car), ov) });
  };

  const setOverride = (key: keyof TCOOverrides, val: string) => {
    onUpdate(car.id, { overrides: { ...car.overrides, [key]: parseFloat(val) }, tco: null });
  };
  const clearOverride = (key: keyof TCOOverrides) => {
    const next = { ...car.overrides }; delete next[key];
    onUpdate(car.id, { overrides: next, tco: null });
  };

  const ready = isReady(car);
  const missingFields = [!car.make && t("fieldMake"), !car.model && t("fieldModel"), (!car.year || car.year <= 1990) && t("fieldYear"), !car.purchasePrice && t("fieldPrice"), !car.annualMileageKm && t("fieldMileage")].filter(Boolean) as string[];
  const carTitle = car.make && car.model ? `${car.year} ${car.make} ${car.model}` : `${t("carLabel")} ${index + 1}`;

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>

      {/* Coloured top stripe */}
      <div className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${accent.from}30, ${accent.to}20)`, border: `1px solid ${accent.from}40` }}>
            <Car size={13} style={{ color: accent.from }} />
          </div>
          <h3 className="text-white font-semibold text-sm truncate">{carTitle}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {car.tco && (
            <span className="text-xs font-bold mr-2 tabular-nums" style={{ color: accent.from }}>
              {formatILS(car.tco.monthlyTCO)}<span className="text-slate-600 font-normal">/{t("mo")}</span>
            </span>
          )}
          <button onClick={() => setShowInputs(v => !v)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-all">
            {showInputs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {canRemove && (
            <button onClick={() => onRemove(car.id)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Inputs ─────────────────────────────────────────────────────────── */}
      {showInputs && (
        <div className="p-5 space-y-4">
          {/* Plate */}
          <div>
            <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
              {t("licensePlate")} <span className="text-slate-700 normal-case font-normal">{t("autoFill")}</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-stretch rounded-lg overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.09)" }}>
                <div className="flex flex-col items-center justify-center px-2.5 shrink-0"
                  style={{ background: "linear-gradient(180deg,#1e3a8a,#1e40af)", borderRight: "1px solid rgba(255,255,255,0.15)" }}>
                  <span className="text-white text-[7px]">✡</span>
                  <span className="text-white text-[8px] font-black tracking-widest">IL</span>
                </div>
                <input type="text" value={plateInput} onChange={(e) => setPlateInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lookupPlate()}
                  placeholder="123-45-678" dir="ltr"
                  className="flex-1 text-sm font-mono tracking-wider bg-transparent text-white placeholder-slate-600 px-3 focus:outline-none"
                  style={{ background: "rgba(248,246,238,0.05)" }} />
              </div>
              <button onClick={lookupPlate} disabled={car.loadingPlate}
                className="px-3 rounded-lg transition-all"
                style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(37,99,235,0.25)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(37,99,235,0.15)")}>
                {car.loadingPlate ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </button>
            </div>
            {car.plateError && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5">
                <AlertCircle size={11} /> {car.plateError}
              </p>
            )}
          </div>

          {/* Make / Model */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("makeLbl")} required>
              <SearchSelect value={car.make} onChange={(v) => onUpdate(car.id, { make: v, model: "", estimates: null, tco: null })}
                options={MAKE_OPTIONS} placeholder="Toyota, טויוטה…" />
            </Field>
            <Field label={t("modelLbl")} required>
              <SearchSelect value={car.model} onChange={(v) => onUpdate(car.id, { model: v, estimates: null, tco: null })}
                options={modelOptions(car.make)} placeholder={car.make ? t("modelLbl") : "—"} disabled={!car.make} />
            </Field>
          </div>

          {/* Year / Engine */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("yearLbl")} required>
              <input type="number" min="1990" max={new Date().getFullYear() + 1} dir="ltr"
                value={car.year || ""} placeholder="2022" className="input-dark"
                onChange={(e) => onUpdate(car.id, { year: parseInt(e.target.value) || 0, estimates: null, tco: null })} />
            </Field>
            <Field label={t("engineLbl")}>
              <input type="number" step="0.1" min="0" dir="ltr" value={car.engineSize ?? ""} placeholder="1.6" className="input-dark"
                onChange={(e) => onUpdate(car.id, { engineSize: e.target.value ? parseFloat(e.target.value) : null, estimates: null, tco: null })} />
            </Field>
          </div>

          <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

          {/* Financial */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("purchasePriceLbl")} required>
              <input type="number" step="1000" min="0" dir="ltr" value={car.purchasePrice || ""} placeholder="לדוגמא: 120,000" className="input-dark"
                onChange={(e) => onUpdate(car.id, { purchasePrice: parseInt(e.target.value) || 0, estimates: null, tco: null })} />
            </Field>
            <Field label={t("annualMileageLbl")} required>
              <input type="number" step="1000" min="0" dir="ltr" value={car.annualMileageKm || ""} placeholder="לדוגמא: 15,000" className="input-dark"
                onChange={(e) => onUpdate(car.id, { annualMileageKm: parseInt(e.target.value) || 0, estimates: null, tco: null })} />
            </Field>
          </div>
          <Field label={t("holdingPeriodLbl")}>
            <input type="number" min="1" max="15" dir="ltr" value={car.holdingPeriodYears || ""} className="input-dark"
              onChange={(e) => onUpdate(car.id, { holdingPeriodYears: parseInt(e.target.value) || 0, estimates: null, tco: null })}
              onBlur={(e) => { if (!parseInt(e.target.value)) onUpdate(car.id, { holdingPeriodYears: 1 }); }} />
          </Field>

          <button onClick={handleEstimate} disabled={!ready}
            title={!ready ? `${t("requiredFields")} ${missingFields.join(", ")}` : undefined}
            className="btn-primary w-full py-3">
            <RefreshCw size={14} /> {t("calculateTCO")}
          </button>
          {!ready && missingFields.length > 0 && (
            <p className="text-slate-600 text-xs -mt-1 text-center">{t("requiredFields")} {missingFields.join(", ")}</p>
          )}
        </div>
      )}

      {/* ── Key Assumptions ───────────────────────────────────────────────── */}
      {car.estimates && (
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between pt-4 pb-1">
            <div>
              <h4 className="text-white text-sm font-semibold">{t("keyAssumptions")}</h4>
              <p className="text-slate-600 text-xs mt-0.5">{t("overrideHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === 2 ? "w-4" : "w-1.5"}`}
                  style={{ background: i <= 2 ? accent.from : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
          </div>

          <EstimateRow icon={Wrench} iconColor="#3b82f6" label={t("maintenanceYr")}
            estimatedDisplay={formatILS(car.estimates.maintenanceILS)} unit="₪/yr"
            manualValue={car.overrides.maintenanceILS != null ? String(car.overrides.maintenanceILS) : null}
            onSave={(v) => setOverride("maintenanceILS", v)} onReset={() => clearOverride("maintenanceILS")} />

          <EstimateRow icon={TrendingDown} iconColor="#f97316" label={t("depreciationYr")}
            estimatedDisplay={`${car.estimates.depreciationRatePercent}%`} unit="%/yr"
            manualValue={car.overrides.depreciationRatePercent != null ? String(car.overrides.depreciationRatePercent) : null}
            onSave={(v) => setOverride("depreciationRatePercent", v)} onReset={() => clearOverride("depreciationRatePercent")} />

          <EstimateRow icon={Fuel} iconColor="#eab308" label={t("fuelEfficiency")}
            estimatedDisplay={`${car.estimates.realWorldKmL} km/L`} unit="km/L"
            manualValue={car.overrides.realWorldKmL != null ? String(car.overrides.realWorldKmL) : null}
            onSave={(v) => setOverride("realWorldKmL", v)} onReset={() => clearOverride("realWorldKmL")} />

          <EstimateRow icon={Fuel} iconColor="#f59e0b" label={t("fuelPriceLbl")}
            estimatedDisplay={`₪${car.estimates.fuelPricePerLiter.toFixed(2)}/L`} unit="₪/L"
            manualValue={car.overrides.fuelPricePerLiter != null ? String(car.overrides.fuelPricePerLiter) : null}
            onSave={(v) => setOverride("fuelPricePerLiter", v)} onReset={() => clearOverride("fuelPricePerLiter")} />

          <EstimateRow icon={ShieldCheck} iconColor="#a78bfa" label={t("insuranceLbl")}
            estimatedDisplay={formatILS(car.estimates.insuranceILS)} unit="₪/yr"
            manualValue={car.overrides.insuranceILS != null ? String(car.overrides.insuranceILS) : null}
            onSave={(v) => setOverride("insuranceILS", v)} onReset={() => clearOverride("insuranceILS")} />

          <button onClick={handleApply} className="btn-success w-full py-3 mt-1">
            <Check size={14} /> {car.tco ? t("recalculate") : t("applyCalculate")}
          </button>
        </div>
      )}

      {/* ── TCO Results ───────────────────────────────────────────────────── */}
      {car.tco && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between pt-4">
            <h4 className="text-white text-sm font-semibold">{t("results")}</h4>
            <span className="text-xs rounded-full px-2.5 py-0.5 font-medium"
              style={car.tco.dataSource === "model-specific"
                ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#6ee7b7" }
                : { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#fcd34d" }}>
              {car.tco.dataSource === "model-specific" ? t("modelData") : t("engineEstimate")}
            </span>
          </div>

          {/* Hero numbers */}
          <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${accent.from}18, ${accent.to}0a)`, border: `1px solid ${accent.from}30` }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-xs mb-1">{t("monthlyTCO")}</p>
                <p className="text-2xl font-extrabold tabular-nums" style={{ color: accent.from }}>
                  {formatILS(car.tco.monthlyTCO)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">{t("annualTCO")}</p>
                <p className="text-2xl font-extrabold text-white tabular-nums">
                  {formatILS(car.tco.annualTCO)}
                </p>
              </div>
            </div>
          </div>

          {/* Proportional cost breakdown */}
          <CostBreakdown tco={car.tco} />

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: t("residualValue"), value: formatILS(car.tco.residualValueILS), color: "#10b981" },
              { label: t("depreciationRate"), value: `${car.tco.depreciationRatePercent}%/yr`, color: "#f97316" },
              ...(car.tco.officialKmPerLiter > 0
                ? [
                  { label: t("officialFuel"), value: `${car.tco.officialKmPerLiter} km/L`, color: "#94a3b8" },
                  { label: t("realWorldFuel"), value: `${car.tco.realWorldKmPerLiter} km/L`, color: "#eab308" },
                ]
                : [{ label: t("fuelTypeLbl"), value: t("electric"), color: "#10b981" }]
              ),
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-slate-600 text-xs mb-0.5">{label}</p>
                <p className="font-bold text-sm tabular-nums" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Scores */}
          <div className="space-y-2.5">
            <ScoreBar score={car.tco.reliabilityScore} label={t("reliabilityScore")} />
            <ScoreBar score={car.tco.resaleScore} label={t("resaleScore")} />
          </div>

          {/* Total holding cost */}
          <div className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <p className="text-slate-500 text-xs">{t("totalHoldingCost")} ({car.holdingPeriodYears})</p>
              <p className="text-white text-xs mt-0.5 text-slate-600">{t("incDepreciation")}</p>
            </div>
            <p className="text-white text-xl font-extrabold tabular-nums">{formatILS(car.tco.totalHoldingCostILS)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Serialise/deserialise draft (strip transient UI state) ────────────────────
type DraftCar = Omit<CarEntry, "loadingPlate" | "plateError">;
function toDraft(c: CarEntry): DraftCar {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { loadingPlate, plateError, ...rest } = c;
  return rest;
}
function fromDraft(d: DraftCar): CarEntry {
  return { ...d, loadingPlate: false, plateError: "" };
}

// ── Page ──────────────────────────────────────────────────────────────────────
function ComparePageInner() {
  const { t } = useLang();
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
  const fuelPrices = { petrol: 7.5, diesel: 7.2 };

  // ── Save / load state ──────────────────────────────────────────────────────
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ cars: DraftCar[]; savedAt: string } | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // On mount: get session + fetch saved draft
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      if (!uid) return;
      supabase
        .from("saved_comparisons")
        .select("cars_data, updated_at")
        .eq("user_id", uid)
        .maybeSingle()
        .then(({ data: row }) => {
          if (row) {
            setDraft({ cars: row.cars_data as DraftCar[], savedAt: row.updated_at });
            setShowDraftBanner(true);
          }
        });
    });
  }, []);

  const saveComparison = useCallback(async () => {
    if (!userId) return;
    setSaveStatus("saving");
    const { error } = await supabase
      .from("saved_comparisons")
      .upsert({ user_id: userId, cars_data: cars.map(toDraft), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) { setSaveStatus("error"); setTimeout(() => setSaveStatus("idle"), 3000); }
    else {
      setSaveStatus("saved");
      setDraft({ cars: cars.map(toDraft), savedAt: new Date().toISOString() });
      setTimeout(() => setSaveStatus("idle"), 2500);
    }
  }, [userId, cars]);

  const loadDraft = () => {
    if (!draft) return;
    setCars(draft.cars.map(fromDraft));
    setShowDraftBanner(false);
  };

  const updateCar = (id: string, updates: Partial<CarEntry>) =>
    setCars((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  const removeCar = (id: string) => setCars((prev) => prev.filter((c) => c.id !== id));
  const addCar = () => {
    if (cars.length >= 3) return;
    const first = cars[0];
    setCars((prev) => [...prev, newCar({ annualMileageKm: first.annualMileageKm, holdingPeriodYears: first.holdingPeriodYears })]);
  };

  const allHaveTCO = cars.length > 1 && cars.every((c) => c.tco !== null);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#070b14" }}>
      {/* Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <Navbar />

      <main className="relative flex-1 px-4 py-8 max-w-7xl mx-auto w-full">

        {/* ── Saved draft banner ──────────────────────────────────────────── */}
        {showDraftBanner && draft && (
          <div className="mb-6 rounded-xl px-5 py-4 flex items-center justify-between gap-4 animate-in"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)" }}>
            <div className="flex items-center gap-3 min-w-0">
              <FolderOpen size={16} className="text-blue-400 shrink-0" />
              <div>
                <p className="text-white text-sm font-semibold">{t("youHaveSaved")}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {t("savedOn")} {new Date(draft.savedAt).toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {" · "}{draft.cars.length} {t("cars")}
                  {draft.cars.filter(c => c.make).map(c => ` · ${c.make} ${c.model}`).join("")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={loadDraft} className="btn-primary !py-2 !px-4 !text-xs !rounded-lg">
                <FolderOpen size={13} /> {t("loadDraft")}
              </button>
              <button onClick={() => setShowDraftBanner(false)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Page header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-slate-600 text-xs uppercase tracking-widest font-semibold mb-1">{t("totalCostOfOwnership")}</p>
            <h1 className="text-white text-2xl font-extrabold tracking-tight">{t("compareVehicles")}</h1>
            <p className="text-slate-600 text-xs mt-1.5">
              {t("fuelDefaultLabel")} <span className="text-amber-400 font-medium">₪{fuelPrices.petrol.toFixed(2)}/L</span>
              <span className="ml-1">{t("editablePerCar")}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {userId && (
              <button onClick={saveComparison} disabled={saveStatus === "saving"}
                className="flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-2.5 transition-all"
                style={{
                  background: saveStatus === "saved" ? "rgba(16,185,129,0.12)" : saveStatus === "error" ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)",
                  border: `1px solid ${saveStatus === "saved" ? "rgba(16,185,129,0.3)" : saveStatus === "error" ? "rgba(239,68,68,0.25)" : "rgba(59,130,246,0.25)"}`,
                  color: saveStatus === "saved" ? "#6ee7b7" : saveStatus === "error" ? "#fca5a5" : "#93c5fd",
                }}>
                {saveStatus === "saving" ? <Loader2 size={14} className="animate-spin" /> : saveStatus === "saved" ? <Check size={14} /> : <Save size={14} />}
                {saveStatus === "saving" ? t("saving") : saveStatus === "saved" ? t("saved") : saveStatus === "error" ? t("errorStatus") : t("save")}
              </button>
            )}
            {cars.length < 3 && (
              <button onClick={addCar}
                className="flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-2.5 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}>
                <Plus size={15} /> {t("addCar")}
              </button>
            )}
          </div>
        </div>

        {/* Cards grid */}
        <div className={`grid gap-5 ${cars.length === 1 ? "grid-cols-1 max-w-sm" : cars.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
          {cars.map((car, i) => (
            <CarCard key={car.id} car={car} index={i} onUpdate={updateCar} onRemove={removeCar} canRemove={cars.length > 1} fuelPrices={fuelPrices} />
          ))}
        </div>

        {/* Summary table */}
        {allHaveTCO && (
          <div className="mt-10 rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-white font-bold">{t("sideBySide")}</h2>
              <p className="text-slate-600 text-xs mt-0.5">{t("bestValueHint")}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <th className="text-left px-6 py-3 text-slate-600 text-xs uppercase tracking-wider font-semibold">{t("metric")}</th>
                    {cars.map((c, i) => (
                      <th key={c.id} className="text-right px-6 py-3 text-xs font-semibold" style={{ color: CARD_ACCENTS[i % CARD_ACCENTS.length].from }}>
                        {c.make ? `${c.make} ${c.model}` : `${t("carLabel")} ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Purchase price row — from CarEntry, not TCOResult */}
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-6 py-3 text-slate-500 text-xs">{t("purchasePriceRow")}</td>
                    {cars.map((c, i) => {
                      const prices = cars.map(x => x.purchasePrice);
                      const best = Math.min(...prices);
                      return (
                        <td key={c.id} className="px-6 py-3 text-right text-xs font-bold tabular-nums"
                          style={{ color: c.purchasePrice === best ? "#34d399" : "#e2e8f0" }}>
                          {formatILS(c.purchasePrice)}
                        </td>
                      );
                    })}
                  </tr>
                  {(
                    [
                      { label: t("monthlyTCORow"),   key: "monthlyTCO",               fmt: formatILS,                                bestIsMin: true  },
                      { label: t("annualTCORow"),    key: "annualTCO",                fmt: formatILS,                                bestIsMin: true  },
                      { label: t("depreciationRow"), key: "depreciationRatePercent",  fmt: (v: number) => `${v}%`,                   bestIsMin: true  },
                      { label: t("fuelRow"),         key: "annualFuelCostILS",        fmt: formatILS,                                bestIsMin: true  },
                      { label: t("maintenanceRow"),  key: "annualMaintenanceCostILS", fmt: formatILS,                                bestIsMin: true  },
                      { label: t("insuranceRow"),    key: "annualInsuranceCostILS",   fmt: formatILS,                                bestIsMin: true  },
                      { label: t("officialFuelRow"), key: "officialKmPerLiter",       fmt: (v: number) => v > 0 ? `${v} km/L` : "EV", bestIsMin: false },
                      { label: t("realWorldRow"),    key: "realWorldKmPerLiter",      fmt: (v: number) => v > 0 ? `${v} km/L` : "EV", bestIsMin: false },
                      { label: t("residualRow"),     key: "residualValueILS",         fmt: formatILS,                                bestIsMin: false },
                      { label: t("reliabilityRow"),  key: "reliabilityScore",         fmt: (v: number) => `${v}/10`,                 bestIsMin: false },
                      { label: t("resaleRow"),       key: "resaleScore",              fmt: (v: number) => `${v}/10`,                 bestIsMin: false },
                    ] as { label: string; key: keyof TCOResult; fmt: (v: number) => string; bestIsMin: boolean }[]
                  ).map(({ label, key, fmt, bestIsMin }) => {
                    const values = cars.map((c) => c.tco![key] as number);
                    const best = bestIsMin ? Math.min(...values) : Math.max(...values);
                    return (
                      <tr key={key} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-6 py-3 text-slate-500 text-xs">{label}</td>
                        {values.map((v, i) => (
                          <td key={cars[i].id} className="px-6 py-3 text-right text-xs font-bold tabular-nums"
                            style={{ color: v === best ? "#34d399" : "#e2e8f0" }}>
                            {fmt(v)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <p className="mt-8 text-slate-700 text-xs text-center">
          {t("disclaimer")}
        </p>
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070b14" }}>
        <Loader2 className="animate-spin text-blue-500" size={28} />
      </div>
    }>
      <ComparePageInner />
    </Suspense>
  );
}
