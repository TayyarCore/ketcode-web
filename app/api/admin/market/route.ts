import { NextResponse } from "next/server";
import { getSuperAdmin } from "@/lib/admin/auth";
import { getMarketIntelligence } from "@/lib/admin/market-data";

export async function GET() {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getMarketIntelligence();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/admin/market failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
