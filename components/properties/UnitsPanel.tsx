'use client'

import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { UnitForm } from './UnitForm'
import { UnitList } from './UnitList'
import { UnitStatsBar } from './UnitStats'
import type { PropertyUnit, UnitStats } from '@/types'

interface UnitsPanelProps {
  propertyId: string
  officeId: string
}

export function UnitsPanel({ propertyId, officeId }: UnitsPanelProps) {
  const [units, setUnits] = useState<PropertyUnit[]>([])
  const [stats, setStats] = useState<UnitStats>({
    total: 0,
    available: 0,
    reserved: 0,
    sold: 0,
    rented: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<PropertyUnit | null>(null)

  const loadUnits = () => {
    setLoading(true)
    fetch(`/api/properties/${propertyId}/units`)
      .then((r) => r.json())
      .then(({ units: u, stats: s }) => {
        setUnits(u ?? [])
        setStats(s)
      })
      .catch(() => setError('فشل تحميل الوحدات'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUnits()
  }, [propertyId])

  const openAdd = () => {
    setEditingUnit(null)
    setFormOpen(true)
  }

  const openEdit = (unit: PropertyUnit) => {
    setEditingUnit(unit)
    setFormOpen(true)
  }

  const handleSaved = (saved: PropertyUnit) => {
    setUnits((prev) => {
      const idx = prev.findIndex((u) => u.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
    loadUnits()
  }

  const handleDelete = async (unit: PropertyUnit) => {
    await fetch(`/api/properties/${propertyId}/units/${unit.id}`, {
      method: 'DELETE',
    })
    loadUnits()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <UnitStatsBar stats={stats} />
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          إضافة وحدة
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      ) : error ? (
        <p className="text-center py-8 text-[var(--muted-foreground)]">{error}</p>
      ) : (
        <UnitList
          propertyId={propertyId}
          units={units}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <UnitForm
        propertyId={propertyId}
        officeId={officeId}
        open={formOpen}
        onOpenChange={setFormOpen}
        unit={editingUnit}
        onSaved={handleSaved}
      />
    </div>
  )
}
