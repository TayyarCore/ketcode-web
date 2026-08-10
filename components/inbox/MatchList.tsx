'use client'

import { useEffect, useState } from 'react'
import { MatchCard } from './MatchCard'
import type { MatchWithUnit } from '@/types'

export function MatchList({ clientId }: { clientId: string }) {
  const [matches, setMatches] = useState<MatchWithUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/matches`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMatches(data)
        else setError(data.error ?? 'خطأ غير معروف')
      })
      .catch(() => setError('فشل تحميل التطابقات'))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    )

  if (error)
    return (
      <p className="text-center py-12 text-[var(--muted-foreground)]">{error}</p>
    )

  if (matches.length === 0)
    return (
      <p className="text-center py-12 text-[var(--muted-foreground)]">
        لا توجد تطابقات
      </p>
    )

  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} />
      ))}
    </div>
  )
}
