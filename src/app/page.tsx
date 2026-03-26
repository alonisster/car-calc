"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Fuel, Wrench, TrendingDown, BarChart3,
  Loader2, AlertCircle, Zap, ShieldCheck, Search, SlidersHorizontal,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { resolveDisplayMake } from "@/lib/carCatalog";
import Link from "next/link";

const FEATURES = [
  {
    icon: Fuel,
    color: "from-amber-500/20 to-amber-600/5",
    iconColor: "text-amber-400",
    title: "Real-World Fuel Cost",
    desc: "WLTP figures corrected +30% for Israeli traffic, summer heat, and AC usage.",
  },
  {
    icon: TrendingDown,
    color: "from-orange-500/20 to-orange-600/5",
    iconColor: "text-orange-400",
    title: "Israeli Depreciation",
    desc: "Annual value drop based on yad2.co.il market trends — 10–16% per year by brand.",
  },
  {
    icon: Wrench,
    color: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-400",
    title: "Smart Maintenance",
    desc: "Age × reliability score formula. A 12-yr Fiat costs 2.4× more than a 12-yr Toyota.",
  },
  {
    icon: BarChart3,
    color: "from-violet-500/20 to-violet-600/5",
    iconColor: "text-violet-400",
    title: "Side-by-Side TCO",
    desc: "Compare up to 3 vehicles with overridable assumptions and full cost breakdown.",
  },
];

interface PlateResult {
  make: string; model: string; year: number;
  trim: string; engineSize: number | null; fuelType: string;
}

type Tab = "plate" | "manual";

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("plate");
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlateResult | null>(null);
  const [error, setError] = useState("");

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!plate.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`/api/car?plate=${encodeURIComponent(plate.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Vehicle not found."); return; }
      setResult(data);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const goToCompare = () => {
    if (!result) return;
    const params = new URLSearchParams({
      plate, make: result.make, model: result.model,
      year: String(result.year), trim: result.trim,
      engineSize: String(result.engineSize ?? ""), fuelType: result.fuelType,
    });
    router.push(`/compare?${params}`);
  };

  const englishMake = result ? resolveDisplayMake(result.make) : "";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#070b14" }}>
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="orb-1 absolute -top-[200px] -right-[150px] w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="orb-2 absolute -bottom-[200px] -left-[150px] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="orb-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <Navbar />

      <main className="relative flex-1 flex flex-col items-center px-4 pt-16 pb-24">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="max-w-2xl w-full text-center animate-in">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-7 text-xs font-medium"
            style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd" }}>
            <span className="relative flex h-2 w-2">
              <span className="ping-slow absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            Israeli Vehicle Registry — Live Data
          </div>

          <h1 className="text-5xl md:text-[4rem] lg:text-[4.5rem] font-extrabold tracking-tight leading-[1.08] text-white mb-4">
            Know the{" "}
            <span style={{ background: "linear-gradient(135deg,#60a5fa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              real cost
            </span>
            <br />of any car
          </h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Fuel, maintenance, and depreciation — tailored to the Israeli market.
            Start with a license plate or pick your car manually.
          </p>

          {/* ── Input card ──────────────────────────────────────────────── */}
          <div className="max-w-lg mx-auto card-glow">
            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <button
                onClick={() => { setTab("plate"); setResult(null); setError(""); }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors"
                style={{
                  color: tab === "plate" ? "#60a5fa" : "#64748b",
                  borderBottom: tab === "plate" ? "2px solid #3b82f6" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                <Search size={14} />
                Search by Plate
              </button>
              <button
                onClick={() => { setTab("manual"); setResult(null); setError(""); }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors"
                style={{
                  color: tab === "manual" ? "#60a5fa" : "#64748b",
                  borderBottom: tab === "manual" ? "2px solid #3b82f6" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                <SlidersHorizontal size={14} />
                Choose Manually
              </button>
            </div>

            <div className="p-6">
              {tab === "plate" ? (
                <div>
                  <p className="text-slate-500 text-sm mb-4">
                    Enter your Israeli plate number — we'll auto-fill make, model, and year.
                  </p>
                  <form onSubmit={lookup} className="space-y-3">
                    {/* Plate-styled input */}
                    <div className="relative rounded-xl overflow-hidden shadow-xl"
                      style={{ border: "2px solid rgba(255,255,255,0.12)" }}>
                      <div className="flex items-stretch">
                        <div className="flex flex-col items-center justify-center gap-0.5 px-3.5 shrink-0 self-stretch"
                          style={{ background: "linear-gradient(180deg,#1e3a8a,#1e40af)", borderRight: "2px solid rgba(255,255,255,0.15)" }}>
                          <span className="text-white text-[9px] leading-none mb-0.5">✡</span>
                          <span className="text-white text-[10px] font-black tracking-widest leading-none">IL</span>
                        </div>
                        <input
                          type="text"
                          value={plate}
                          onChange={(e) => { setPlate(e.target.value); setResult(null); setError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && lookup()}
                          placeholder="123-45-678"
                          maxLength={12}
                          className="flex-1 text-center text-2xl font-black tracking-[0.22em] py-3.5 focus:outline-none"
                          style={{ background: "#f8f6ee", color: "#111", caretColor: "#2563eb" }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !plate.trim()}
                      className="btn-primary w-full py-3 text-sm"
                    >
                      {loading
                        ? <><Loader2 size={16} className="animate-spin" /> Looking up…</>
                        : <><Zap size={15} /> Look Up Vehicle</>
                      }
                    </button>
                  </form>

                  {error && (
                    <div className="mt-3 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm animate-in"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                      <AlertCircle size={15} className="shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Result → big CTA */}
                  {result && (
                    <div className="mt-4 animate-in">
                      <div className="rounded-xl p-4 mb-3"
                        style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck size={14} className="text-emerald-400" />
                          <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Vehicle Found</span>
                        </div>
                        <p className="text-white text-lg font-bold">
                          {result.year} {englishMake} {result.model}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {result.trim && (
                            <span className="text-xs rounded-full px-2.5 py-0.5 font-medium"
                              style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}>
                              {result.trim}
                            </span>
                          )}
                          {result.engineSize && (
                            <span className="text-xs rounded-full px-2.5 py-0.5"
                              style={{ background: "rgba(255,255,255,0.07)", color: "#94a3b8" }}>
                              {result.engineSize}L
                            </span>
                          )}
                          {result.fuelType && (
                            <span className="text-xs rounded-full px-2.5 py-0.5"
                              style={{ background: "rgba(255,255,255,0.07)", color: "#94a3b8" }}>
                              {result.fuelType}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={goToCompare}
                        className="btn-success w-full py-3.5 text-base font-bold"
                      >
                        Start TCO Comparison <ArrowRight size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                    style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}>
                    <BarChart3 className="text-blue-400" size={26} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Pick your cars, compare costs</h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    Choose make, model, year and purchase price for up to 3 cars.
                    We'll calculate full TCO with fuel, maintenance, and depreciation.
                  </p>
                  <Link href="/compare" className="btn-primary w-full py-3.5 text-base font-bold inline-flex items-center justify-center gap-2">
                    Open Comparison Tool <ArrowRight size={18} />
                  </Link>
                  <p className="text-slate-600 text-xs mt-4">
                    You can also search by plate on the comparison page to add a second or third car.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Feature grid ──────────────────────────────────────────────── */}
        <div className="mt-16 max-w-3xl w-full grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in delay-200">
          {FEATURES.map(({ icon: Icon, color, iconColor, title, desc }) => (
            <div key={title} className="group rounded-2xl p-5 flex gap-4 transition-all duration-200 cursor-default"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
              <div className={`rounded-xl p-2.5 shrink-0 h-fit bg-gradient-to-br ${color}`}>
                <Icon className={iconColor} size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-slate-700 text-xs text-center max-w-md animate-in delay-300">
          Estimates based on Israeli market data. Fuel ₪7.50/L. Actual costs vary.
        </p>
      </main>
    </div>
  );
}
