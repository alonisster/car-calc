import { NextRequest, NextResponse } from "next/server";
import { getCarData } from "@/lib/getCarData";
import { rateLimit } from "@/lib/rateLimit";

// 15 plate lookups per minute per IP — generous for real users, blocks scrapers
const LIMIT = 15;
const WINDOW_MS = 60 * 1000;

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(request: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = getIP(request);
  const result = rateLimit(ip, LIMIT, WINDOW_MS);

  if (!result.allowed) {
    const retryAfterSec = Math.ceil(result.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "יותר מדי בקשות. נסה שוב בעוד רגע." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(LIMIT),
          "X-RateLimit-Window": "60s",
        },
      }
    );
  }

  // ── Plate validation ───────────────────────────────────────────────────────
  const plate = request.nextUrl.searchParams.get("plate");

  if (!plate) {
    return NextResponse.json(
      { error: "License plate is required" },
      { status: 400 }
    );
  }

  // Reject obviously invalid input before hitting the government API
  if (plate.length > 20 || !/^[\d\-]+$/.test(plate.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "מספר לוחית לא תקין" }, { status: 400 });
  }

  try {
    const data = await getCarData(plate);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
