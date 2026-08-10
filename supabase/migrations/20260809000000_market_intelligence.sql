-- Market Intelligence system for Tayyar V2
--
-- Anonymized market data derived from canonical.properties (no personal
-- data), readable only by super admins.
--
-- Schema notes: the live schema keeps entities in `canonical`/`app`, not
-- `public`, and column names differ from the original spec:
--   properties      -> canonical.properties (public.properties is a VIEW,
--                      so the sync trigger must target the base table)
--   offices         -> app.organizations
--   profiles/users  -> app.org_members
--   clients         -> canonical.contacts
--   matches         -> canonical.interests
--   opportunities   -> canonical.deals
--   location_city   -> city          type       -> property_type
--   location_district -> district    usage_type -> use_type
--   office_id       -> org_id        price_per_sqm -> derived (price/area)

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.market_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city            TEXT NOT NULL,
  district        TEXT,
  property_type   TEXT NOT NULL,
  purpose         TEXT NOT NULL,
  usage_type      TEXT,
  price           NUMERIC,
  area_sqm        NUMERIC,
  price_per_sqm   NUMERIC,
  status          TEXT,
  days_on_market  INTEGER,
  recorded_at     TIMESTAMPTZ DEFAULT NOW(),
  source_hash     TEXT
);

CREATE INDEX IF NOT EXISTS market_data_city_idx        ON public.market_data (city);
CREATE INDEX IF NOT EXISTS market_data_recorded_at_idx ON public.market_data (recorded_at);
CREATE INDEX IF NOT EXISTS market_data_source_hash_idx ON public.market_data (source_hash, recorded_at DESC);

CREATE TABLE IF NOT EXISTS public.super_admins (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Explicit grants, on top of the existing platform-operator model below.
INSERT INTO public.super_admins (id)
SELECT id FROM auth.users
WHERE id = 'ebb90594-eb5f-4929-99f2-850e045ddda6'
   OR email = 'info@ketcode.com'
ON CONFLICT DO NOTHING;

-- Super admin = explicitly granted, or an active member of an org flagged
-- as platform operator. Reuses the concept behind app.is_platform_operator()
-- so admin access stays consistent with the rest of the system.
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE id = p_user_id)
      OR EXISTS (
        SELECT 1
        FROM app.org_members m
        JOIN app.organizations o ON o.id = m.org_id
        WHERE m.user_id = p_user_id
          AND m.is_active
          AND o.is_platform_operator = TRUE
      );
$fn$;

-- ─────────────────────────────────────────────
-- Sync trigger + backfill on canonical.properties
-- SECURITY DEFINER so writes succeed under market_data's RLS.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_market_data()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  IF NEW.city IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.market_data (
    city, district, property_type, purpose,
    usage_type, price, area_sqm, price_per_sqm,
    status, days_on_market, source_hash
  )
  VALUES (
    NEW.city,
    NEW.district,
    NEW.property_type::text,
    NEW.purpose::text,
    NEW.use_type::text,
    NEW.price,
    NEW.area_sqm,
    NEW.price / NULLIF(NEW.area_sqm, 0),
    NEW.status::text,
    EXTRACT(DAY FROM NOW() - NEW.created_at)::INTEGER,
    encode(sha256((NEW.org_id::text || NEW.id::text)::bytea), 'hex')
  );
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS after_property_market_sync ON canonical.properties;
CREATE TRIGGER after_property_market_sync
  AFTER INSERT OR UPDATE ON canonical.properties
  FOR EACH ROW EXECUTE FUNCTION public.sync_market_data();

-- Backfill existing inventory (idempotent: skips properties already recorded).
INSERT INTO public.market_data (
  city, district, property_type, purpose,
  usage_type, price, area_sqm, price_per_sqm,
  status, days_on_market, source_hash
)
SELECT
  p.city, p.district, p.property_type::text, p.purpose::text,
  p.use_type::text, p.price, p.area_sqm,
  p.price / NULLIF(p.area_sqm, 0),
  p.status::text,
  EXTRACT(DAY FROM NOW() - p.created_at)::INTEGER,
  encode(sha256((p.org_id::text || p.id::text)::bytea), 'hex')
FROM canonical.properties p
WHERE p.city IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.market_data m
    WHERE m.source_hash = encode(sha256((p.org_id::text || p.id::text)::bytea), 'hex')
  );

-- ─────────────────────────────────────────────
-- RLS: only super admins can read
-- ─────────────────────────────────────────────

ALTER TABLE public.market_data  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_data: super admin only" ON public.market_data;
CREATE POLICY "market_data: super admin only"
  ON public.market_data FOR SELECT
  USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admins: read own row" ON public.super_admins;
CREATE POLICY "super_admins: read own row"
  ON public.super_admins FOR SELECT
  USING (id = auth.uid());

-- ─────────────────────────────────────────────
-- Admin analytics (service_role only, via the admin API)
--
-- Distributions read the latest snapshot per property so that repeatedly
-- edited listings don't skew the counts; market_data itself stays an
-- append-only history.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_market_summary()
RETURNS JSON LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  WITH latest AS (
    SELECT DISTINCT ON (source_hash) *
    FROM public.market_data ORDER BY source_hash, recorded_at DESC
  )
  SELECT json_build_object(
    'total_properties',  COUNT(*),
    'cities_count',      COUNT(DISTINCT city),
    'avg_price',         AVG(price),
    'avg_price_per_sqm', AVG(price_per_sqm)
  ) FROM latest;
$fn$;

CREATE OR REPLACE FUNCTION public.admin_market_by_city()
RETURNS JSON LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  WITH latest AS (
    SELECT DISTINCT ON (source_hash) *
    FROM public.market_data ORDER BY source_hash, recorded_at DESC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT city, COUNT(*) AS count, AVG(price) AS avg_price,
      AVG(price_per_sqm) AS avg_price_sqm
    FROM latest GROUP BY city ORDER BY count DESC
  ) t;
$fn$;

CREATE OR REPLACE FUNCTION public.admin_market_by_type()
RETURNS JSON LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  WITH latest AS (
    SELECT DISTINCT ON (source_hash) *
    FROM public.market_data ORDER BY source_hash, recorded_at DESC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT property_type, COUNT(*) AS count, AVG(price) AS avg_price
    FROM latest GROUP BY property_type ORDER BY count DESC
  ) t;
$fn$;

CREATE OR REPLACE FUNCTION public.admin_market_by_district()
RETURNS JSON LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  WITH latest AS (
    SELECT DISTINCT ON (source_hash) *
    FROM public.market_data ORDER BY source_hash, recorded_at DESC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT district, city, COUNT(*) AS count,
      AVG(price_per_sqm) AS avg_price_sqm
    FROM latest WHERE district IS NOT NULL
    GROUP BY district, city ORDER BY count DESC LIMIT 10
  ) t;
$fn$;

CREATE OR REPLACE FUNCTION public.admin_market_monthly_trend()
RETURNS JSON LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT
      TO_CHAR(DATE_TRUNC('month', recorded_at), 'YYYY-MM') AS month,
      COUNT(*) AS count,
      AVG(price) AS avg_price
    FROM public.market_data
    WHERE recorded_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', recorded_at)
    ORDER BY 1
  ) t;
$fn$;

CREATE OR REPLACE FUNCTION public.admin_system_health()
RETURNS JSON LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT json_build_object(
    'offices',       (SELECT COUNT(*) FROM app.organizations),
    'users',         (SELECT COUNT(*) FROM app.org_members WHERE is_active),
    'properties',    (SELECT COUNT(*) FROM canonical.properties WHERE archived_at IS NULL),
    'clients',       (SELECT COUNT(*) FROM canonical.contacts),
    'matches',       (SELECT COUNT(*) FROM canonical.interests),
    'opportunities', (SELECT COUNT(*) FROM canonical.deals)
  );
$fn$;

-- Explicit column list: never expose CR/VAT numbers or other org identifiers.
-- `city` is derived from the org's most common property location, since
-- app.organizations has no city column.
CREATE OR REPLACE FUNCTION public.admin_offices_stats()
RETURNS JSON LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT
      o.id,
      o.name,
      (SELECT p.city FROM canonical.properties p
        WHERE p.org_id = o.id AND p.city IS NOT NULL
        GROUP BY p.city ORDER BY COUNT(*) DESC LIMIT 1) AS city,
      o.plan,
      o.created_at,
      (SELECT COUNT(*) FROM canonical.properties p WHERE p.org_id = o.id) AS properties_count,
      (SELECT COUNT(*) FROM canonical.contacts   c WHERE c.org_id = o.id) AS clients_count,
      (SELECT COUNT(*) FROM app.org_members      m WHERE m.org_id = o.id AND m.is_active) AS users_count
    FROM app.organizations o
    ORDER BY o.created_at DESC
  ) t;
$fn$;

-- Admin analytics are for the service-role admin API only.
REVOKE EXECUTE ON FUNCTION public.admin_market_summary()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_market_by_city()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_market_by_type()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_market_by_district()   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_market_monthly_trend() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_system_health()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_offices_stats()        FROM PUBLIC, anon, authenticated;
