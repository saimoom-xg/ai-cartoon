import { NextResponse } from "next/server";
import { ASSETS } from "@/lib/assets/library";

export const runtime = "nodejs";

export async function GET() {
  const categories = Array.from(new Set(ASSETS.map((a) => a.category)));
  const types = Array.from(new Set(ASSETS.map((a) => a.type)));

  return NextResponse.json({
    assets: ASSETS,
    types,
    categories,
    total: ASSETS.length,
  });
}
