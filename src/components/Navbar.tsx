"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, LogOut, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);

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
    <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-blue-500 rounded-lg p-1.5">
            <Car className="text-white" size={18} />
          </div>
          <span className="text-white font-bold tracking-tight">
            Car-Calc <span className="text-blue-400">IL</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-slate-400 text-sm flex items-center gap-1.5">
                <User size={14} />
                {user.user_metadata?.first_name ?? user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-slate-300 hover:text-white text-sm transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
              >
                Sign up free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
