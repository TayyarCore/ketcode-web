import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'
import type { PropertyUnit, UnitStats } from '@/types'

export const dynamic = 'force-dynamic'

const insertSchema = z.object({
  unit_number: z.string().min(1),
  office_id: z.string().uuid(),
  area_sqm: z.coerce.number().nullable().optional(),
  price: z.coerce.number().nullable().optional(),
  bedrooms: z.coerce.number().int().nullable().optional(),
  bathrooms: z.coerce.number().int().nullable().optional(),
  floor: z.coerce.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['available', 'reserved', 'sold', 'rented', 'unlisted']).optional(),
  purpose: z.enum(['sale', 'rent']).optional(),
  location_district: z.string().nullable().optional(),
  price_per_sqm: z.coerce.number().nullable().optional(),
})

function buildStats(units: PropertyUnit[]): UnitStats {
  return {
    total: units.length,
    available: units.filter((u) => u.status === 'available').length,
    reserved: units.filter((u) => u.status === 'reserved').length,
    sold: units.filter((u) => u.status === 'sold').length,
    rented: units.filter((u) => u.status === 'rented').length,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data, error } = await adminClient
    .from('property_units')
    .select('*')
    .eq('property_id', id)
    .order('unit_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const units = (data ?? []) as PropertyUnit[]
  return NextResponse.json({ units, stats: buildStats(units) })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const parsed = insertSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await adminClient
    .from('property_units')
    .insert({ ...parsed.data, property_id: id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
