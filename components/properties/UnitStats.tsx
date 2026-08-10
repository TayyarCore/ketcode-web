import type { UnitStats } from '@/types'

const statItems = [
  { key: 'total' as const, label: 'الإجمالي', color: 'text-foreground' },
  { key: 'available' as const, label: 'متاح', color: 'text-emerald-700' },
  { key: 'reserved' as const, label: 'محجوز', color: 'text-amber-700' },
  { key: 'sold' as const, label: 'مباع', color: 'text-blue-700' },
  { key: 'rented' as const, label: 'مؤجر', color: 'text-purple-700' },
]

export function UnitStatsBar({ stats }: { stats: UnitStats }) {
  return (
    <div className="flex flex-wrap gap-4">
      {statItems.map(({ key, label, color }) => (
        <div key={key} className="flex flex-col items-center">
          <span className={`text-2xl font-bold ${color}`}>{stats[key]}</span>
          <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
        </div>
      ))}
    </div>
  )
}
