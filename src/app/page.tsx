"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Fuel,
  Wrench,
  TrendingDown,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const FEATURES = [
  {
    icon: Fuel,
    title: "Real-World Fuel Cost",
    desc: "Manufacturer figures corrected for Israeli road conditions, traffic, and AC usage.",
  },
  {
    icon: TrendingDown,
    title: "Israeli Depreciation",
    desc: "Annual value drop based on local market trends — 10–15% per year.",
  },
  {
    icon: Wrench,
    title: "Maintenance Estimates",
    desc: "Small and big service costs tailored to each brand in the Israeli market.",
  },
  {
    icon: BarChart3,
    title: "Side-by-Side Comparison",
    desc: "Compare up to 3 vehicles with monthly and annual TCO breakdown.",
  },
];

interface PlateResult {
  make: string;
  model: string;
  year: number;
  trim: string;
  engineSize: number | null;
  fuelType: string;
}

export default function HomePage() {
  const router = useRouter();
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlateResult | null>(null);
  const [error, setError] = useState("");

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!plate.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(
        `/api/car?plate=${encodeURIComponent(plate.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Vehicle not found.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goToCompare = () => {
    if (!result) return;
    const params = new URLSearchParams({
      plate,
      make: result.make,
      model: result.model,
      year: String(result.year),
      trim: result.trim,
      engineSize: String(result.engineSize ?? ""),
      fuelType: result.fuelType,
    });
    router.push(`/compare?${params}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      <Navbar />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-3xl w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Israeli Vehicle Registry — Live Data
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-4">
            Know the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              real cost
            </span>{" "}
            of your car
          </h1>
          <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-xl mx-auto">
            Enter any Israeli license plate. Get instant fuel, maintenance, and
            depreciation analysis — then compare up to 3 cars side-by-side.
          </p>

          {/* Search bar */}
          <form
            onSubmit={lookup}
            className="flex flex-col sm:flex-row items-stretch gap-3 max-w-lg mx-auto"
          >
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="e.g. 123-45-678"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest"
                maxLength={12}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !plate.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-3.5 text-base transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Search <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 max-w-lg mx-auto">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Result card */}
          {result && (
            <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5 max-w-lg mx-auto text-left">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
                    Vehicle Found
                  </div>
                  <h2 className="text-white text-xl font-bold">
                    {result.year} {result.make} {result.model}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.trim && (
                      <span className="bg-blue-500/10 text-blue-400 text-xs rounded-full px-2.5 py-0.5 border border-blue-500/20">
                        {result.trim}
                      </span>
                    )}
                    {result.engineSize && (
                      <span className="bg-slate-700 text-slate-300 text-xs rounded-full px-2.5 py-0.5">
                        {result.engineSize}L
                      </span>
                    )}
                    {result.fuelType && (
                      <span className="bg-slate-700 text-slate-300 text-xs rounded-full px-2.5 py-0.5">
                        {result.fuelType}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={goToCompare}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  Compare <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feature grid */}
        <div className="mt-24 max-w-4xl w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4"
            >
              <div className="bg-blue-500/10 rounded-xl p-2.5 shrink-0 h-fit">
                <Icon className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">
                  {title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-12 text-slate-600 text-xs text-center max-w-xl">
          TCO estimates are based on Israeli market data and Smart Estimator
          logic. Fuel price: &#8362;7.50/L. Actual costs may vary.
        </p>
      </main>
    </div>
  );
}
