"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, Eye, EyeOff, Loader2, ArrowRight, Check, X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

// ── Password strength ─────────────────────────────────────────────────────────
interface StrengthResult {
  score: number;       // 0–4
  label: string;
  barColor: string;
  meetsRequirement: boolean;
  hasLength: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function analysePassword(pwd: string, lang: string): StrengthResult {
  const hasLength  = pwd.length >= 8;
  const hasLower   = /[a-z]/.test(pwd);
  const hasNumber  = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

  const categoriesMet = [hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const meetsRequirement = hasLength && categoriesMet >= 2;

  // Score 0–4
  let score = 0;
  if (hasLength)          score++;
  if (categoriesMet >= 2) score++;
  if (categoriesMet >= 3) score++;
  if (pwd.length >= 12)   score++;

  const he = ["חלש מאוד", "חלש", "בינוני", "חזק", "חזק מאוד"];
  const en = ["Very Weak",  "Weak",  "Fair",    "Strong", "Very Strong"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  return {
    score,
    label: lang === "he" ? he[score] : en[score],
    barColor: colors[score],
    meetsRequirement,
    hasLength, hasLower, hasNumber, hasSpecial,
  };
}

// ── Criterion row ─────────────────────────────────────────────────────────────
function Criterion({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="shrink-0" style={{ color: met ? "#22c55e" : "#475569" }}>
        {met ? <Check size={11} /> : <X size={11} />}
      </span>
      <span className="text-xs" style={{ color: met ? "#86efac" : "#475569" }}>{label}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (e.target.name === "password") setTouched(true);
  };

  const strength = analysePassword(form.password, lang);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!strength.meetsRequirement) return;
    setError("");
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { first_name: form.firstName, last_name: form.lastName, phone: form.phone } },
    });

    setLoading(false);
    if (signUpError) { setError(signUpError.message); return; }
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#070b14" }}>
      {/* Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-0 -left-40 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div className="relative w-full max-w-md animate-in">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-lg blur-sm opacity-60" />
            <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-2">
              <BarChart3 className="text-white" size={20} />
            </div>
          </div>
          <span className="text-white text-xl font-bold tracking-tight">
            Car‑Calc<span className="text-blue-400 ml-0.5">IL</span>
          </span>
        </Link>

        <div className="card-glow">
          <div className="p-7">
            <h1 className="text-white text-2xl font-bold mb-1">{t("createAccount")}</h1>
            <p className="text-slate-500 text-sm mb-6">
              {t("alreadyHaveAccount")}{" "}
              <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                {t("signInLink")}
              </Link>
            </p>

            {error && (
              <div className="rounded-lg px-4 py-3 mb-5 text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                    {t("firstNameLbl")} <span className="text-blue-500">*</span>
                  </label>
                  <input name="firstName" type="text" required value={form.firstName} onChange={handleChange}
                    className="input-dark" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                    {t("lastNameLbl")} <span className="text-blue-500">*</span>
                  </label>
                  <input name="lastName" type="text" required value={form.lastName} onChange={handleChange}
                    className="input-dark" />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                  {t("emailLbl")} <span className="text-blue-500">*</span>
                </label>
                <input name="email" type="email" required value={form.email} onChange={handleChange}
                  placeholder="avi@example.com" className="input-dark" dir="ltr" />
              </div>

              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                  {t("phoneLbl")} <span className="text-blue-500">*</span>
                </label>
                <input name="phone" type="tel" required value={form.phone} onChange={handleChange}
                  placeholder="05X-XXXXXXX" className="input-dark" dir="ltr" />
              </div>

              {/* ── Password field ── */}
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                  {t("passwordLbl")} <span className="text-blue-500">*</span>
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder={lang === "he" ? "מינימום 8 תווים" : "Min. 8 characters"}
                    className="input-dark pr-10"
                    dir="ltr"
                    style={touched && form.password && !strength.meetsRequirement
                      ? { border: "1px solid rgba(239,68,68,0.5)" }
                      : touched && strength.meetsRequirement
                      ? { border: "1px solid rgba(34,197,94,0.4)" }
                      : {}}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength bar — only show once user starts typing */}
                {touched && form.password.length > 0 && (
                  <div className="mt-3 space-y-2.5">
                    {/* Bar + label */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.07)" }}>
                            <div className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: strength.score > i ? "100%" : "0%",
                                background: strength.barColor,
                              }} />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-semibold shrink-0 w-20 text-left"
                        style={{ color: strength.barColor }}>
                        {strength.label}
                      </span>
                    </div>

                    {/* Criteria checklist */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-0.5">
                      <Criterion met={strength.hasLength}
                        label={lang === "he" ? "לפחות 8 תווים" : "At least 8 chars"} />
                      <Criterion met={strength.hasLower}
                        label={lang === "he" ? "אותיות קטנות" : "Lowercase letters"} />
                      <Criterion met={strength.hasNumber}
                        label={lang === "he" ? "ספרות (0–9)" : "Numbers (0–9)"} />
                      <Criterion met={strength.hasSpecial}
                        label={lang === "he" ? "תווים מיוחדים (!@#…)" : "Special chars (!@#…)"} />
                    </div>

                    {/* Requirement hint */}
                    {!strength.meetsRequirement && (
                      <p className="text-xs" style={{ color: "#f97316" }}>
                        {lang === "he"
                          ? "נדרשות לפחות 2 מתוך: ספרות, אותיות קטנות, תווים מיוחדים"
                          : "Requires at least 2 of: numbers, lowercase letters, special characters"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button type="submit"
                disabled={loading || (touched && !strength.meetsRequirement)}
                className="btn-primary w-full py-3 mt-1">
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> {t("creatingAccount")}</>
                  : <>{t("createAccountBtn")} <ArrowRight size={15} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
