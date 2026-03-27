"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLang();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setLoading(false);
    if (err) { setError(err.message); return; }
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

      <div className="relative w-full max-w-sm animate-in">
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
            <h1 className="text-white text-2xl font-bold mb-1">{t("welcomeBack")}</h1>
            <p className="text-slate-500 text-sm mb-6">
              {t("noAccount")}{" "}
              <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                {t("signUpFreeLink")}
              </Link>
            </p>

            {error && (
              <div className="rounded-lg px-4 py-3 mb-5 text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">{t("emailLbl")}</label>
                <input name="email" type="email" required value={form.email} onChange={handleChange}
                  placeholder="avi@example.com" className="input-dark" dir="ltr" />
              </div>

              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">{t("passwordLbl")}</label>
                <div className="relative">
                  <input name="password" type={showPassword ? "text" : "password"} required
                    value={form.password} onChange={handleChange}
                    placeholder="••••••••" className="input-dark pr-10" dir="ltr" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
                {loading ? <><Loader2 size={15} className="animate-spin" /> {t("signingIn")}</> : <>{t("signInBtn")} <ArrowRight size={15} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
