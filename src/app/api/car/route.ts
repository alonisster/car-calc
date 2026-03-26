import { NextRequest, NextResponse } from "next/server";
import { getCarData } from "@/lib/getCarData";

export async function GET(request: NextRequest) {
  const plate = request.nextUrl.searchParams.get("plate");

  if (!plate) {
    return NextResponse.json(
      { error: "License plate is required" },
      { status: 400 }
    );
  }

  try {
    const data = await getCarData(plate);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
