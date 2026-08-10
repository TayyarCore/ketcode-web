'use client'

import { Dialog } from '@base-ui/react/dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { PropertyUnit } from '@/types'
import { cn } from '@/lib/utils'

const schema = z.object({
  unit_number: z.string().min(1, 'رقم الوحدة مطلوب'),
  floor: z.coerce.number().int().nullable().optional(),
  bedrooms: z.coerce.number().int().nullable().optional(),
  bathrooms: z.coerce.number().int().nullable().optional(),
  area_sqm: z.coerce.number().nullable().optional(),
  price: z.coerce.number().nullable().optional(),
  purpose: z.enum(['sale', 'rent']).optional(),
  status: z.enum(['available', 'reserved', 'sold', 'rented', 'unlisted']).optional(),
  location_district: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof schema>

interface UnitFormProps {
  propertyId: string
  officeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  unit?: PropertyUnit | null
  onSaved: (unit: PropertyUnit) => void
}

const purposeLabels = { sale: 'بيع', rent: 'إيجار' }
const statusLabels = {
  available: 'متاح',
  reserved: 'محجوز',
  sold: 'مباع',
  rented: 'مؤجر',
  unlisted: 'غير مدرج',
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>
      {children}
      {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]'

export function UnitForm({
  propertyId,
  officeId,
  open,
  onOpenChange,
  unit,
  onSaved,
}: UnitFormProps) {
  const isEdit = !!unit

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: unit
      ? {
          unit_number: unit.unit_number,
          floor: unit.floor,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          area_sqm: unit.area_sqm,
          price: unit.price,
          purpose: unit.purpose,
          status: unit.status,
          location_district: unit.location_district,
          notes: unit.notes,
        }
      : { status: 'available', purpose: 'sale' },
  })

  useEffect(() => {
    if (open) {
      reset(
        unit
          ? {
              unit_number: unit.unit_number,
              floor: unit.floor,
              bedrooms: unit.bedrooms,
              bathrooms: unit.bathrooms,
              area_sqm: unit.area_sqm,
              price: unit.price,
              purpose: unit.purpose,
              status: unit.status,
              location_district: unit.location_district,
              notes: unit.notes,
            }
          : { status: 'available', purpose: 'sale' }
      )
    }
  }, [open, unit, reset])

  const onSubmit = async (values: FormValues) => {
    const url = isEdit
      ? `/api/properties/${propertyId}/units/${unit!.id}`
      : `/api/properties/${propertyId}/units`
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? values : { ...values, office_id: officeId }),
    })

    if (!res.ok) return
    const saved: PropertyUnit = await res.json()
    onSaved(saved)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <Dialog.Title className="font-semibold text-base">
                {isEdit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
              </Dialog.Title>
              <Dialog.Close
                className="rounded-lg p-1 hover:bg-[var(--muted)] transition-colors"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="رقم الوحدة" error={errors.unit_number?.message}>
                  <input {...register('unit_number')} className={inputCls} />
                </Field>
                <Field label="الطابق">
                  <input
                    {...register('floor')}
                    type="number"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="غرف النوم">
                  <input
                    {...register('bedrooms')}
                    type="number"
                    className={inputCls}
                  />
                </Field>
                <Field label="الحمامات">
                  <input
                    {...register('bathrooms')}
                    type="number"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="المساحة (م²)">
                  <input
                    {...register('area_sqm')}
                    type="number"
                    step="0.01"
                    className={inputCls}
                  />
                </Field>
                <Field label="السعر (ريال)">
                  <input
                    {...register('price')}
                    type="number"
                    step="0.01"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="الغرض">
                  <select {...register('purpose')} className={inputCls}>
                    {Object.entries(purposeLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="الحالة">
                  <select {...register('status')} className={inputCls}>
                    {Object.entries(statusLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="الحي">
                <input
                  {...register('location_district')}
                  className={inputCls}
                />
              </Field>

              <Field label="ملاحظات">
                <textarea
                  {...register('notes')}
                  rows={2}
                  className={cn(inputCls, 'resize-none')}
                />
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <Dialog.Close
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
                  render={<button type="button" />}
                >
                  إلغاء
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? '...' : isEdit ? 'حفظ' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
