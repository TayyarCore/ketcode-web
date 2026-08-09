import Link from "next/link";
import { getSuperAdmin } from "@/lib/admin/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const superAdmin = await getSuperAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-e border-gray-200 bg-gray-50 p-4">
        <div className="mb-8 text-xl font-bold">تيّار</div>
        <nav className="flex flex-1 flex-col gap-1">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 hover:bg-gray-200"
          >
            🏠 الرئيسية
          </Link>
        </nav>
        {superAdmin && (
          <Link
            href="/admin"
            className="mt-auto rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-200"
          >
            ⚙️ لوحة الإدارة
          </Link>
        )}
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
