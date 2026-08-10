-- Close two SECURITY DEFINER functions that Supabase's security advisor
-- flagged as reachable over /rest/v1/rpc by anon and authenticated.
--
-- is_super_admin(uuid) answers about an arbitrary user, so leaving it exposed
-- let anyone enumerate super admins. It cannot simply be revoked, though:
-- RLS policy expressions are evaluated as the querying role, so the function
-- the market_data policy calls must stay EXECUTE-able by `authenticated`.
-- The fix is a no-argument variant that only reports on the caller.

CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT public.is_super_admin(auth.uid());
$fn$;

DROP POLICY IF EXISTS "market_data: super admin only" ON public.market_data;
CREATE POLICY "market_data: super admin only"
  ON public.market_data FOR SELECT
  USING (public.current_user_is_super_admin());

-- The uuid overload is for the service-role admin API only; the trigger
-- function is never a legitimate RPC target.
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_market_data()   FROM PUBLIC, anon, authenticated;
