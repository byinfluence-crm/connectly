-- ═══════════════════════════════════════════════════════════════════
-- Campos extendidos de perfil de marca — Connectly
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Nuevas columnas en brand_profiles ────────────────────────
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS cover_photo_url  TEXT,
  ADD COLUMN IF NOT EXISTS gallery_urls     TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS locations        JSONB   DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS instagram_url    TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url       TEXT,
  ADD COLUMN IF NOT EXISTS price_range      TEXT    CHECK (price_range IN ('€','€€','€€€','€€€€')),
  ADD COLUMN IF NOT EXISTS cuisine_type     TEXT,
  ADD COLUMN IF NOT EXISTS schedule         TEXT,
  ADD COLUMN IF NOT EXISTS collab_brief     TEXT;

-- ─── 2. Actualizar vista pública con los nuevos campos seguros ────
CREATE OR REPLACE VIEW v_brand_profiles_public
  WITH (security_invoker = on)
AS
SELECT
  id, user_id, brand_name, logo_url, cover_photo_url, gallery_urls,
  sector, cuisine_type, description, collab_brief,
  city, website, instagram_url, tiktok_url,
  price_range, schedule, locations,
  rating_avg, total_reviews, is_verified
FROM brand_profiles;

-- ─── 3. Bucket de almacenamiento para activos de marca ───────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ─── 4. Políticas de Storage ─────────────────────────────────────
-- Cualquiera puede ver las imágenes (son públicas)
DROP POLICY IF EXISTS "public read brand assets" ON storage.objects;
CREATE POLICY "public read brand assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-assets');

-- Solo la marca propietaria puede subir a su carpeta (carpeta = su user_id)
DROP POLICY IF EXISTS "brand uploads own assets" ON storage.objects;
CREATE POLICY "brand uploads own assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'brand-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "brand deletes own assets" ON storage.objects;
CREATE POLICY "brand deletes own assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'brand-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
