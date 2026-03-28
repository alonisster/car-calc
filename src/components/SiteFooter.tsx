"use client";

import { useLang } from "@/contexts/LanguageContext";

export default function SiteFooter() {
  const { lang } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer
      className="w-full mt-auto px-4 py-8"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.25)" }}
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 text-center">

        {/* Legal disclaimer */}
        <p className="text-slate-600 text-xs leading-relaxed max-w-2xl">
          {lang === "he" ? (
            <>
              <span className="text-slate-500 font-semibold">הצהרת אחריות: </span>
              המידע והחישובים המוצגים באתר זה מיועדים למטרות אינפורמטיביות בלבד ואינם מהווים ייעוץ פיננסי, משפטי או מקצועי מכל סוג שהוא.
              ההערכות מבוססות על נתוני שוק כלליים ועשויות שלא לשקף את העלויות בפועל עבור רכב ספציפי, נהג ספציפי, או תנאי שוק משתנים.
              בעל האתר אינו אחראי לכל נזק, הפסד, או החלטה שנעשתה על בסיס המידע המוצג. השימוש בכלי זה הוא באחריות המשתמש בלבד.
            </>
          ) : (
            <>
              <span className="text-slate-500 font-semibold">Disclaimer: </span>
              The information and calculations presented on this site are for informational purposes only and do not constitute financial, legal, or professional advice of any kind.
              Estimates are based on general market data and may not reflect actual costs for a specific vehicle, driver, or changing market conditions.
              The site owner assumes no responsibility for any damage, loss, or decision made based on the information displayed. Use of this tool is at the user&apos;s own risk.
            </>
          )}
        </p>

        {/* Divider */}
        <div className="w-16 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

        {/* Copyright */}
        <p className="text-slate-700 text-xs">
          {lang === "he"
            ? `© ${year} Car-Calc IL — כל הזכויות שמורות`
            : `© ${year} Car-Calc IL — All rights reserved`}
        </p>

      </div>
    </footer>
  );
}
