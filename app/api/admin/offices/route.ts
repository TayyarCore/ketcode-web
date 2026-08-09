import { NextResponse } from "next/server";
import { getSuperAdmin } from "@/lib/admin/auth";
import { getOfficesStats } from "@/lib/admin/market-data";

export async function GET() {
  const admin = await getSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const offices = await getOfficesStats();
    return NextResponse.json({ offices });
  } catch (error) {
    console.error("GET /api/admin/offices failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
