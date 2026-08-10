import { MatchList } from '@/components/inbox/MatchList'

export default async function ClientMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="min-h-screen bg-[var(--background)] p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold">تطابقات العميل</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            العقارات والوحدات المتطابقة مع متطلبات العميل
          </p>
        </div>
        <MatchList clientId={id} />
      </div>
    </main>
  )
}
