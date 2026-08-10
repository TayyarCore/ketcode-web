import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'

const patchSchema = z.object({
  unit_number: z.string().min(1).optional(),
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  const { id, unitId } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await adminClient
    .from('property_units')
    .update(parsed.data)
    .eq('id', unitId)
    .eq('property_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  const { id, unitId } = await params
  const { error } = await adminClient
    .from('property_units')
    .delete()
    .eq('id', unitId)
    .eq('property_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
