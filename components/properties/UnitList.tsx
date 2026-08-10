'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { UnitStatusBadge } from './UnitStatusBadge'
import { formatCurrency } from '@/lib/utils'
import type { PropertyUnit } from '@/types'

interface UnitListProps {
  propertyId: string
  units: PropertyUnit[]
  onEdit: (unit: PropertyUnit) => void
  onDelete: (unit: PropertyUnit) => void
}

export function UnitList({ units, onEdit, onDelete }: UnitListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (unit: PropertyUnit) => {
    if (!confirm(`حذف الوحدة ${unit.unit_number}؟`)) return
    setDeleting(unit.id)
    onDelete(unit)
    setDeleting(null)
  }

  if (units.length === 0)
    return (
      <p className="text-center py-8 text-[var(--muted-foreground)] text-sm">
        لا توجد وحدات. أضف وحدة للبداية.
      </p>
    )

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--muted)] text-[var(--muted-foreground)]">
          <tr>
            <th className="px-4 py-3 text-start font-medium">رقم الوحدة</th>
            <th className="px-4 py-3 text-start font-medium">الطابق</th>
            <th className="px-4 py-3 text-start font-medium">الغرف</th>
            <th className="px-4 py-3 text-start font-medium">المساحة</th>
            <th className="px-4 py-3 text-start font-medium">السعر</th>
            <th className="px-4 py-3 text-start font-medium">الحالة</th>
            <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {units.map((unit) => (
            <tr
              key={unit.id}
              className="bg-[var(--card)] hover:bg-[var(--muted)] transition-colors"
            >
              <td className="px-4 py-3 font-medium">{unit.unit_number}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">
                {unit.floor ?? '—'}
              </td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">
                {unit.bedrooms ?? '—'}
              </td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">
                {unit.area_sqm != null ? `${unit.area_sqm} م²` : '—'}
              </td>
              <td className="px-4 py-3">
                {unit.price != null ? formatCurrency(unit.price) : '—'}
              </td>
              <td className="px-4 py-3">
                <UnitStatusBadge status={unit.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(unit)}
                    className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    aria-label="تعديل"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(unit)}
                    disabled={deleting === unit.id}
                    className="rounded-lg p-1.5 hover:bg-red-50 transition-colors text-[var(--muted-foreground)] hover:text-red-600 disabled:opacity-50"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
