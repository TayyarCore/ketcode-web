import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data, error } = await adminClient
    .from('matches')
    .select(`
      id, score, score_breakdown, status, created_at, unit_id,
      properties (id, title, type, price, location_district, bedrooms, demand_score, status),
      property_units (id, unit_number, area_sqm, price, bedrooms, status)
    `)
    .eq('client_id', id)
    .neq('status', 'expired')
    .order('score', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
