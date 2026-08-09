import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns the authenticated user if they are a super admin, otherwise null.
// Every admin API route and admin page must gate on this.
export async function getSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const adminClient = createAdminClient();
  const { data: isAdmin } = await adminClient
    .from("super_admins")
    .select("id")
    .eq("id", user.id)
    .single();

  return isAdmin ? user : null;
}
