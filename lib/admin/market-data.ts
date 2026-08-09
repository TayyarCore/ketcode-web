import { createAdminClient } from "@/lib/supabase/admin";
import type { MarketIntelligence, OfficeStats } from "@/lib/admin/types";

// Shared by the /api/admin/* routes and the /admin server page so the
// dashboard doesn't have to round-trip through its own API.
export async function getMarketIntelligence(): Promise<MarketIntelligence> {
  const adminClient = createAdminClient();

  const [summary, byCity, byType, byDistrict, monthlyTrend, systemHealth] =
    await Promise.all([
      adminClient.rpc("admin_market_summary"),
      adminClient.rpc("admin_market_by_city"),
      adminClient.rpc("admin_market_by_type"),
      adminClient.rpc("admin_market_by_district"),
      adminClient.rpc("admin_market_monthly_trend"),
      adminClient.rpc("admin_system_health"),
    ]);

  const failed = [summary, byCity, byType, byDistrict, monthlyTrend, systemHealth]
    .map((r) => r.error)
    .find(Boolean);
  if (failed) throw new Error(`Market intelligence query failed: ${failed.message}`);

  return {
    summary: summary.data,
    byCity: byCity.data ?? [],
    byType: byType.data ?? [],
    byDistrict: byDistrict.data ?? [],
    monthlyTrend: monthlyTrend.data ?? [],
    systemHealth: systemHealth.data,
  };
}

export async function getOfficesStats(): Promise<OfficeStats[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("admin_offices_stats");
  if (error) throw new Error(`Offices query failed: ${error.message}`);
  return data ?? [];
}
