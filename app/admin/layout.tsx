import { redirect } from "next/navigation";
import { getSuperAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const superAdmin = await getSuperAdmin();
  if (!superAdmin) redirect("/");

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
        <h1 className="text-lg font-bold">تيّار — لوحة الإدارة</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-gray-700 px-4 py-1.5 text-sm hover:bg-gray-800"
          >
            تسجيل الخروج
          </button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
