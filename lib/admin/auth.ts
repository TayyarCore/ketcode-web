import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns the authenticated user if they are a super admin, otherwise null.
// Every admin API route and admin page must gate on this.
//
// Authority lives in public.is_super_admin(uuid), which grants access to
// explicitly listed super_admins and to active members of an organization
// flagged is_platform_operator — the project's existing admin concept.
export async function getSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const adminClient = createAdminClient();
  const { data: isAdmin, error } = await adminClient.rpc("is_super_admin", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("Super admin check failed:", error.message);
    return null;
  }

  return isAdmin === true ? user : null;
}
