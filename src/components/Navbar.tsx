"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, BarChart3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useLang } from "@/contexts/LanguageContext";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06]"
      style={{ background: "rgba(7,11,20,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-1.5">
              <BarChart3 className="text-white" size={16} />
            </div>
          </div>
          <span className="font-bold tracking-tight text-white">
            Car‑Calc<span className="text-blue-400 ml-0.5">IL</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-3">
          {/* Compare link */}
          <Link href="/compare"
            className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">
            {t("openCompareTool")}
          </Link>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "he" ? "en" : "he")}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
            }}
            title={lang === "he" ? "Switch to English" : "עבור לעברית"}
          >
            <span className="text-[10px] opacity-60">{lang === "he" ? "🇮🇱" : "🇬🇧"}</span>
            {t("langToggle")}
          </button>

          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm bg-white/5 border border-white/[0.07] rounded-full px-3 py-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {(user.user_metadata?.first_name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                </div>
                {user.user_metadata?.first_name ?? user.email}
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                title={t("signOut")}
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login"
                className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">
                {t("signIn")}
              </Link>
              <Link href="/auth/signup"
                className="btn-primary !py-1.5 !px-3.5 !text-xs !rounded-lg">
                {t("signUpFree")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
