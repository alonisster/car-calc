"use client";

import Link from "next/link";
import { ArrowRight, Fuel, Wrench, TrendingDown, ShieldCheck, CheckCircle2, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLang } from "@/contexts/LanguageContext";

// ── Example data (illustrative) ───────────────────────────────────────────────
const EXAMPLE_CARS = [
  {
    name: "Dacia Duster 2019",
    purchase: 68000,
    annualFuel: 11200,
    annualMaint: 5800,
    annualDepr: 9520,
    annualIns: 5100,
    accent: "#d97706",
    tag: { he: "הכי זול לקנייה", en: "Cheapest to buy" },
  },
  {
    name: "Toyota Corolla 2020",
    purchase: 95000,
    annualFuel: 7200,
    annualMaint: 3200,
    annualDepr: 10450,
    annualIns: 6400,
    accent: "#2563eb",
    tag: { he: "הכי זול לבעלות ✓", en: "Cheapest to own ✓" },
    best: true,
  },
  {
    name: "Skoda Octavia 2018",
    purchase: 82000,
    annualFuel: 8600,
    annualMaint: 6200,
    annualDepr: 11480,
    annualIns: 5800,
    accent: "#7c3aed",
    tag: { he: "באמצע", en: "Middle ground" },
  },
];

const HOLDING_YEARS = 5;

export default function HomePage() {
  const { t, lang } = useLang();

  const HIDDEN_COSTS = [
    { icon: Fuel,         color: "#eab308", bg: "rgba(234,179,8,0.12)",   title: t("guideCostFuelTitle"),  desc: t("guideCostFuelDesc") },
    { icon: Wrench,       color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  title: t("guideCostMaintTitle"), desc: t("guideCostMaintDesc") },
    { icon: TrendingDown, color: "#f97316", bg: "rgba(249,115,22,0.12)",  title: t("guideCostDeprTitle"),  desc: t("guideCostDeprDesc") },
    { icon: ShieldCheck,  color: "#a78bfa", bg: "rgba(167,139,250,0.12)", title: t("guideCostInsTitle"),   desc: t("guideCostInsDesc") },
  ];

  const LESSONS = [
    t("guideLessonsCheapest"),
    t("guideLessonsReliable"),
    t("guideLessonsDepreciation"),
    t("guideLessonsData"),
  ];

  const HOW_STEPS = [
    { n: "1", title: t("guideHowStep1Title"), desc: t("guideHowStep1Desc") },
    { n: "2", title: t("guideHowStep2Title"), desc: t("guideHowStep2Desc") },
    { n: "3", title: t("guideHowStep3Title"), desc: t("guideHowStep3Desc") },
  ];

  const fmt = (n: number) =>
    new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#070b14" }}>
      {/* Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <Navbar />

      <main className="relative flex-1 flex flex-col items-center px-4 pt-14 pb-24 gap-20">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="max-w-2xl w-full text-center animate-in">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-medium"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd" }}>
            <BookOpen size={12} />
            {t("guideBadge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
            {t("guideHeroTitle")}{" "}
            <span style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t("guideHeroGradient")}
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto">
            {t("guideHeroSub")}
          </p>
        </section>

        {/* ── Hidden costs ──────────────────────────────────────────────────── */}
        <section className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-white text-2xl font-bold mb-2">{t("guideWhyTitle")}</h2>
            <p className="text-slate-500 text-sm">{t("guideWhySub")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HIDDEN_COSTS.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="rounded-2xl p-5 flex gap-4"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Example comparison ────────────────────────────────────────────── */}
        <section className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-white text-2xl font-bold mb-2">{t("guideExampleTitle")}</h2>
            <p className="text-slate-500 text-sm">{t("guideExampleSub")}</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {EXAMPLE_CARS.map((car) => {
              const annual = car.annualFuel + car.annualMaint + car.annualDepr + car.annualIns;
              const total5yr = annual * HOLDING_YEARS;
              return (
                <div key={car.name} className="rounded-2xl overflow-hidden flex flex-col"
                  style={{
                    background: car.best ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.025)",
                    border: `1px solid ${car.best ? "rgba(37,99,235,0.35)" : "rgba(255,255,255,0.07)"}`,
                  }}>
                  <div className="h-1 w-full" style={{ background: car.accent }} />
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    {/* Name + tag */}
                    <div>
                      <p className="text-white font-bold text-sm">{car.name}</p>
                      <span className="text-xs font-semibold mt-1 inline-block rounded-full px-2.5 py-0.5"
                        style={{
                          background: car.best ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.06)",
                          color: car.best ? "#93c5fd" : "#64748b",
                        }}>
                        {lang === "he" ? car.tag.he : car.tag.en}
                      </span>
                    </div>

                    {/* Purchase price */}
                    <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <p className="text-slate-500 text-xs mb-0.5">{lang === "he" ? "מחיר קנייה" : "Purchase price"}</p>
                      <p className="text-white font-bold text-base">{fmt(car.purchase)}</p>
                    </div>

                    {/* Annual breakdown */}
                    <div className="space-y-1.5">
                      {[
                        { label: lang === "he" ? "דלק" : "Fuel",            value: car.annualFuel,  color: "#eab308" },
                        { label: lang === "he" ? "תחזוקה" : "Maintenance",  value: car.annualMaint, color: "#3b82f6" },
                        { label: lang === "he" ? "פחת" : "Depreciation",    value: car.annualDepr,  color: "#f97316" },
                        { label: lang === "he" ? "ביטוח" : "Insurance",     value: car.annualIns,   color: "#a78bfa" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
                            {label}
                          </span>
                          <span className="text-slate-300 font-medium tabular-nums">{fmt(value)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                    {/* Totals */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">{lang === "he" ? "עלות שנתית" : "Annual cost"}</span>
                        <span className="text-white font-semibold tabular-nums">{fmt(annual)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">{lang === "he" ? `סה"כ ${HOLDING_YEARS} שנים` : `Total ${HOLDING_YEARS} years`}</span>
                        <span className="font-extrabold tabular-nums" style={{ color: car.accent }}>{fmt(total5yr)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Insight callout */}
          <div className="rounded-2xl px-6 py-5"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <p className="text-emerald-400 font-bold text-base mb-1">
              {lang === "he"
                ? "טויוטה קורולה חוסכת ~₪27,000 על פני 5 שנים — למרות שעלתה ₪27,000 יותר לקנייה"
                : "Toyota Corolla saves ~₪27,000 over 5 years — despite costing ₪27,000 more to buy"}
            </p>
            <p className="text-slate-500 text-sm">{t("guideExampleNote")}</p>
          </div>
        </section>

        {/* ── Lessons ───────────────────────────────────────────────────────── */}
        <section className="max-w-2xl w-full">
          <h2 className="text-white text-2xl font-bold mb-6 text-center">{t("guideLessonsTitle")}</h2>
          <div className="space-y-3">
            {LESSONS.map((lesson, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-sm leading-relaxed">{lesson}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How to use ────────────────────────────────────────────────────── */}
        <section className="max-w-2xl w-full">
          <h2 className="text-white text-2xl font-bold mb-6 text-center">{t("guideHowTitle")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {HOW_STEPS.map(({ n, title, desc }) => (
              <div key={n} className="rounded-2xl p-5 text-center"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold"
                  style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" }}>
                  {n}
                </div>
                <h3 className="text-white font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <section className="max-w-md w-full text-center">
          <div className="rounded-3xl px-8 py-10"
            style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <h2 className="text-white text-xl font-bold mb-4">{t("guideCtaTitle")}</h2>
            <Link href="/compare" className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold rounded-2xl">
              {t("guideCtaBtn")} <ArrowRight size={18} />
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
