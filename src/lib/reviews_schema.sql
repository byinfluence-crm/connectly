-- ═══════════════════════════════════════════════════════════════════
-- Sistema de reseñas y entrega de resultados — Connectly
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. Estado de la colaboración en collab_applications
ALTER TABLE collab_applications
  ADD COLUMN IF NOT EXISTS collab_status TEXT DEFAULT 'active'
    CHECK (collab_status IN ('active', 'pending_brand_review', 'completed'));

-- 2. Tabla de entregas del influencer
CREATE TABLE IF NOT EXISTS collaboration_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES collab_applications(id) ON DELETE CASCADE,
  influencer_id   UUID NOT NULL REFERENCES marketplace_users(id),

  -- Publicaciones
  post_urls       TEXT[] DEFAULT '{}',
  content_types   TEXT[] DEFAULT '{}',  -- 'post','reel','story','tiktok','youtube_short'

  -- Stats contenido permanente
  reach           INT,
  impressions     INT,
  interactions    INT,
  video_views     INT,

  -- Stats stories
  stories_count   INT,
  story_views_avg INT,
  link_clicks     INT,
  story_replies   INT,
  sticker_taps    INT,

  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id)
);

-- 3. Ampliar tabla reviews con categorías y metadatos de colaboración
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS application_id       UUID REFERENCES collab_applications(id),
  ADD COLUMN IF NOT EXISTS reviewer_id          UUID REFERENCES marketplace_users(id),
  ADD COLUMN IF NOT EXISTS reviewed_id          UUID REFERENCES marketplace_users(id),
  ADD COLUMN IF NOT EXISTS reviewer_role        TEXT CHECK (reviewer_role IN ('brand', 'influencer')),
  ADD COLUMN IF NOT EXISTS rating               SMALLINT CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_communication SMALLINT CHECK (rating_communication BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_professionalism SMALLINT CHECK (rating_professionalism BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_results       SMALLINT CHECK (rating_results BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS would_repeat         BOOLEAN,
  ADD COLUMN IF NOT EXISTS comment              TEXT;

-- 4. Tabla de notificaciones internas
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES marketplace_users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  read        BOOLEAN DEFAULT false,
  data        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_collab_deliveries_app   ON collaboration_deliveries(application_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed         ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_application      ON reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user       ON notifications(user_id, read, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- RLS básico (ejecutar después de crear las tablas)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE collaboration_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede insertar su entrega
CREATE POLICY "influencer inserts own delivery" ON collaboration_deliveries
  FOR INSERT WITH CHECK (auth.uid() = influencer_id);

-- Solo el influencer y la marca de la aplicación pueden ver la entrega
CREATE POLICY "parties can read delivery" ON collaboration_deliveries
  FOR SELECT USING (
    auth.uid() = influencer_id OR
    auth.uid() IN (
      SELECT brand_id FROM collab_applications WHERE id = application_id
    )
  );

-- Cada usuario solo ve sus notificaciones
CREATE POLICY "user reads own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "system inserts notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "user marks read" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
