import { UnitStatusBadge } from '@/components/properties/UnitStatusBadge'
import { formatCurrency } from '@/lib/utils'
import type { MatchWithUnit } from '@/types'

const propertyTypeLabel: Record<string, string> = {
  apartment: 'شقة',
  villa: 'فيلا',
  land: 'أرض',
  office: 'مكتب',
  warehouse: 'مستودع',
  commercial: 'تجاري',
  compound: 'مجمع',
  apartment_building: 'عمارة',
}

export function MatchCard({ match }: { match: MatchWithUnit }) {
  const { properties: prop, property_units: unit, score, unit_id } = match

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">{prop.title}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {propertyTypeLabel[prop.type] ?? prop.type}
            {prop.location_district ? ` · ${prop.location_district}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-[var(--muted-foreground)]">تطابق</span>
          <span className="font-bold text-sm">{Math.round(score)}%</span>
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-[var(--muted)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--primary)]"
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>

      {unit_id && unit ? (
        <div className="rounded-lg bg-[var(--muted)] p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">
              وحدة {unit.unit_number}
            </span>
            <UnitStatusBadge status={unit.status} />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
            {unit.bedrooms != null && <span>{unit.bedrooms} غرفة</span>}
            {unit.area_sqm != null && <span>{unit.area_sqm} م²</span>}
            {unit.price != null && (
              <span className="font-medium text-[var(--foreground)]">
                {formatCurrency(unit.price)}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
          {prop.bedrooms != null && <span>{prop.bedrooms} غرفة</span>}
          {prop.price != null && (
            <span className="font-medium text-[var(--foreground)]">
              {formatCurrency(prop.price)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
