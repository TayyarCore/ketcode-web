-- Market Intelligence system for Tayyar V2
--
-- Anonymized market data collected from properties (no personal data),
-- readable only by super admins. Parts that depend on the `properties`
-- table (trigger + backfill) are guarded so this migration also runs
-- cleanly on databases where the base schema does not exist yet.

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS market_data (
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

CREATE INDEX IF NOT EXISTS market_data_city_idx        ON market_data (city);
CREATE INDEX IF NOT EXISTS market_data_recorded_at_idx ON market_data (recorded_at);

CREATE TABLE IF NOT EXISTS super_admins (
  id         UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO super_admins (id)
VALUES ('ebb90594-eb5f-4929-99f2-850e045ddda6')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- Sync trigger + backfill (only when `properties` exists)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_market_data()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO market_data (
    city, district, property_type, purpose,
    usage_type, price, area_sqm, price_per_sqm,
    status, days_on_market, source_hash
  )
  VALUES (
    NEW.location_city,
    NEW.location_district,
    NEW.type::text,
    NEW.purpose::text,
    NEW.usage_type,
    NEW.price,
    NEW.area_sqm,
    NEW.price_per_sqm,
    NEW.status::text,
    EXTRACT(DAY FROM NOW() - NEW.created_at)::INTEGER,
    encode(sha256((NEW.office_id::text || NEW.id::text)::bytea), 'hex')
  );
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.properties') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS after_property_market_sync ON properties;
    CREATE TRIGGER after_property_market_sync
      AFTER INSERT OR UPDATE ON properties
      FOR EACH ROW EXECUTE FUNCTION sync_market_data();

    INSERT INTO market_data (
      city, district, property_type, purpose,
      usage_type, price, area_sqm, price_per_sqm,
      status, source_hash
    )
    SELECT
      location_city, location_district, type::text, purpose::text,
      usage_type, price, area_sqm, price_per_sqm,
      status::text,
      encode(sha256((office_id::text || id::text)::bytea), 'hex')
    FROM properties
    WHERE location_city IS NOT NULL;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────
-- RLS: only super admins can read market_data
-- ─────────────────────────────────────────────

ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_data: super admin only" ON market_data;
CREATE POLICY "market_data: super admin only"
  ON market_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "super_admins: read own row" ON super_admins;
CREATE POLICY "super_admins: read own row"
  ON super_admins FOR SELECT
  USING (id = auth.uid());

-- ─────────────────────────────────────────────
-- Admin analytics functions (called via service_role from the API)
-- Missing base tables degrade to zero counts instead of erroring.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_market_summary()
RETURNS JSON LANGUAGE sql STABLE AS $$
  SELECT json_build_object(
    'total_properties',  COUNT(*),
    'cities_count',      COUNT(DISTINCT city),
    'avg_price',         AVG(price),
    'avg_price_per_sqm', AVG(price_per_sqm)
  )
  FROM market_data
$$;

CREATE OR REPLACE FUNCTION admin_market_by_city()
RETURNS JSON LANGUAGE sql STABLE AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT city, COUNT(*) AS count, AVG(price) AS avg_price,
      AVG(price_per_sqm) AS avg_price_sqm
    FROM market_data
    GROUP BY city ORDER BY count DESC
  ) t
$$;

CREATE OR REPLACE FUNCTION admin_market_by_type()
RETURNS JSON LANGUAGE sql STABLE AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT property_type, COUNT(*) AS count, AVG(price) AS avg_price
    FROM market_data
    GROUP BY property_type ORDER BY count DESC
  ) t
$$;

CREATE OR REPLACE FUNCTION admin_market_by_district()
RETURNS JSON LANGUAGE sql STABLE AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT district, city, COUNT(*) AS count,
      AVG(price_per_sqm) AS avg_price_sqm
    FROM market_data
    WHERE district IS NOT NULL
    GROUP BY district, city
    ORDER BY count DESC LIMIT 10
  ) t
$$;

CREATE OR REPLACE FUNCTION admin_market_monthly_trend()
RETURNS JSON LANGUAGE sql STABLE AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT
      TO_CHAR(DATE_TRUNC('month', recorded_at), 'YYYY-MM') AS month,
      COUNT(*) AS count,
      AVG(price) AS avg_price
    FROM market_data
    WHERE recorded_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', recorded_at)
    ORDER BY 1
  ) t
$$;

CREATE OR REPLACE FUNCTION admin_system_health()
RETURNS JSON LANGUAGE plpgsql STABLE AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'offices',       CASE WHEN to_regclass('public.offices')       IS NULL THEN 0 ELSE (SELECT COUNT(*) FROM offices) END,
    'users',         CASE WHEN to_regclass('public.profiles')      IS NULL THEN 0 ELSE (SELECT COUNT(*) FROM profiles) END,
    'properties',    CASE WHEN to_regclass('public.properties')    IS NULL THEN 0 ELSE (SELECT COUNT(*) FROM properties) END,
    'clients',       CASE WHEN to_regclass('public.clients')       IS NULL THEN 0 ELSE (SELECT COUNT(*) FROM clients) END,
    'matches',       CASE WHEN to_regclass('public.matches')       IS NULL THEN 0 ELSE (SELECT COUNT(*) FROM matches) END,
    'opportunities', CASE WHEN to_regclass('public.opportunities') IS NULL THEN 0 ELSE (SELECT COUNT(*) FROM opportunities) END
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_offices_stats()
RETURNS JSON LANGUAGE plpgsql STABLE AS $$
DECLARE
  result JSON;
BEGIN
  IF to_regclass('public.offices') IS NULL THEN
    RETURN '[]'::json;
  END IF;

  EXECUTE $q$
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT o.*,
        COUNT(DISTINCT p.id)  AS properties_count,
        COUNT(DISTINCT c.id)  AS clients_count,
        COUNT(DISTINCT pr.id) AS users_count
      FROM offices o
      LEFT JOIN properties p ON p.office_id = o.id
      LEFT JOIN clients c    ON c.office_id = o.id
      LEFT JOIN profiles pr  ON pr.office_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    ) t
  $q$ INTO result;
  RETURN result;
END;
$$;

-- These functions are for the admin API (service_role) only.
REVOKE EXECUTE ON FUNCTION admin_market_summary()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_market_by_city()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_market_by_type()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_market_by_district()   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_market_monthly_trend() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_system_health()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_offices_stats()        FROM PUBLIC, anon, authenticated;
