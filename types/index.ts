export type UnitStatus = 'available' | 'reserved' | 'sold' | 'rented' | 'unlisted'
export type PropertyPurpose = 'sale' | 'rent'
export type PropertyType =
  | 'apartment'
  | 'villa'
  | 'land'
  | 'office'
  | 'warehouse'
  | 'commercial'
  | 'compound'
  | 'apartment_building'

export interface PropertyUnit {
  id: string
  property_id: string
  office_id: string
  unit_number: string
  area_sqm: number | null
  price: number | null
  status: UnitStatus
  bedrooms: number | null
  bathrooms: number | null
  floor: number | null
  notes: string | null
  purpose: PropertyPurpose
  location_district: string | null
  price_per_sqm: number | null
  created_at: string
  updated_at: string
}

export interface UnitStats {
  total: number
  available: number
  reserved: number
  sold: number
  rented: number
}

export interface PropertySummary {
  id: string
  title: string
  type: PropertyType
  price: number
  location_district: string
  bedrooms: number | null
  demand_score: number
  status: string
}

export interface MatchWithUnit {
  id: string
  score: number
  score_breakdown: Record<string, number>
  status: string
  created_at: string
  unit_id: string | null
  properties: PropertySummary
  property_units: Pick<PropertyUnit, 'id' | 'unit_number' | 'area_sqm' | 'price' | 'bedrooms' | 'status'> | null
}
