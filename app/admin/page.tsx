import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getMarketIntelligence, getOfficesStats } from "@/lib/admin/market-data";

// Auth guard lives in app/admin/layout.tsx (redirects non-super-admins).
export default async function AdminPage() {
  const [market, offices] = await Promise.all([
    getMarketIntelligence(),
    getOfficesStats(),
  ]);

  return <AdminDashboard market={market} offices={offices} />;
}
