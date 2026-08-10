import { UnitsPanel } from '@/components/properties/UnitsPanel'

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="min-h-screen bg-[var(--background)] p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-xl font-bold">وحدات العقار</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            إدارة الوحدات المتاحة داخل هذا العقار
          </p>
        </div>
        <UnitsPanel
          propertyId={id}
          officeId={process.env.DEFAULT_OFFICE_ID ?? ''}
        />
      </div>
    </main>
  )
}
