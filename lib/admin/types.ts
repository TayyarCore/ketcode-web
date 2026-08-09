export interface MarketSummary {
  total_properties: number;
  cities_count: number;
  avg_price: number | null;
  avg_price_per_sqm: number | null;
}

export interface CityStats {
  city: string;
  count: number;
  avg_price: number | null;
  avg_price_sqm: number | null;
}

export interface TypeStats {
  property_type: string;
  count: number;
  avg_price: number | null;
}

export interface DistrictStats {
  district: string;
  city: string;
  count: number;
  avg_price_sqm: number | null;
}

export interface MonthlyTrend {
  month: string;
  count: number;
  avg_price: number | null;
}

export interface SystemHealth {
  offices: number;
  users: number;
  properties: number;
  clients: number;
  matches: number;
  opportunities: number;
}

export interface MarketIntelligence {
  summary: MarketSummary;
  byCity: CityStats[];
  byType: TypeStats[];
  byDistrict: DistrictStats[];
  monthlyTrend: MonthlyTrend[];
  systemHealth: SystemHealth;
}

export interface OfficeStats {
  id: string;
  name: string | null;
  city: string | null;
  plan: string | null;
  created_at: string | null;
  properties_count: number;
  clients_count: number;
  users_count: number;
}
