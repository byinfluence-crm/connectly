-- ═══════════════════════════════════════════════════════════════════
-- FASE 1: Auth & Roles — Connectly
-- Ejecutar en Supabase SQL Editor después de security_hardening.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Políticas INSERT para el flujo de registro ────────────────
-- (security_hardening.sql solo añadió SELECT y UPDATE)

DROP POLICY IF EXISTS "user inserts own marketplace profile" ON marketplace_users;
CREATE POLICY "user inserts own marketplace profile" ON marketplace_users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "influencer inserts own profile" ON influencer_profiles;
CREATE POLICY "influencer inserts own profile" ON influencer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "brand inserts own profile" ON brand_profiles;
CREATE POLICY "brand inserts own profile" ON brand_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── 2. Tabla de agencias ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agencies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  owner_id     UUID NOT NULL REFERENCES marketplace_users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency owner reads own" ON agencies;
CREATE POLICY "agency owner reads own" ON agencies
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "agency owner manages own" ON agencies;
CREATE POLICY "agency owner manages own" ON agencies
  FOR ALL USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ─── 3. Tabla de marcas gestionadas por agencia ───────────────────
CREATE TABLE IF NOT EXISTS agency_brands (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  brand_user_id   UUID NOT NULL REFERENCES marketplace_users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, brand_user_id)
);

ALTER TABLE agency_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency reads own brand links" ON agency_brands;
CREATE POLICY "agency reads own brand links" ON agency_brands
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM agencies WHERE id = agency_id
    )
  );

DROP POLICY IF EXISTS "agency manages own brand links" ON agency_brands;
CREATE POLICY "agency manages own brand links" ON agency_brands
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_id FROM agencies WHERE id = agency_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM agencies WHERE id = agency_id
    )
  );

-- ─── 4. Columna creator_type en influencer_profiles (si no existe) ─
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS creator_type TEXT DEFAULT 'influencer'
    CHECK (creator_type IN ('influencer', 'ugc', 'both'));

-- ─── 5. Columnas de plataformas en influencer_profiles ───────────
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}';

-- ─── 6. Índice para búsquedas de agencia ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_agency_brands_agency ON agency_brands(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_brands_brand  ON agency_brands(brand_user_id);

-- ─── 7. La vista pública de influencers ahora incluye creator_type ─
CREATE OR REPLACE VIEW v_influencer_profiles_public
  WITH (security_invoker = on)
AS
SELECT
  id, user_id, display_name, bio, avatar_url, city,
  instagram_handle, tiktok_handle, followers_ig, followers_tt,
  niches, price_min, price_max, rating_avg, total_reviews,
  is_verified, creator_type, platforms
FROM influencer_profiles;

-- ═══════════════════════════════════════════════════════════════════
-- INSTRUCCIÓN MANUAL: activar superadmin para tu usuario
-- 1. Ve a Authentication > Users en Supabase
-- 2. Copia tu User UID
-- 3. Ejecuta esta query (reemplaza el UUID):
-- ═══════════════════════════════════════════════════════════════════
--
-- UPDATE marketplace_users
-- SET user_type = 'superadmin'
-- WHERE id = 'PEGA-AQUI-TU-USER-UUID';
--
-- INSERT INTO agencies (name, owner_id)
-- VALUES ('Tu Agencia', 'PEGA-AQUI-TU-USER-UUID');
