import { cn } from '@/lib/utils'
import type { UnitStatus } from '@/types'

const statusConfig: Record<UnitStatus, { label: string; className: string }> = {
  available: { label: 'متاح', className: 'bg-emerald-100 text-emerald-800' },
  reserved: { label: 'محجوز', className: 'bg-amber-100 text-amber-800' },
  sold: { label: 'مباع', className: 'bg-blue-100 text-blue-800' },
  rented: { label: 'مؤجر', className: 'bg-purple-100 text-purple-800' },
  unlisted: { label: 'غير مدرج', className: 'bg-gray-100 text-gray-600' },
}

export function UnitStatusBadge({
  status,
  className,
}: {
  status: UnitStatus
  className?: string
}) {
  const cfg = statusConfig[status] ?? statusConfig.unlisted
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </span>
  )
}
