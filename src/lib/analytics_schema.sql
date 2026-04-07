-- ═══════════════════════════════════════════════════════════════════
-- Panel de analytics — Connectly
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- Score histórico del influencer (para ver evolución)
CREATE TABLE IF NOT EXISTS influencer_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id     UUID NOT NULL REFERENCES marketplace_users(id) ON DELETE CASCADE,
  score             SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  engagement_factor DECIMAL(4,2),
  rating_factor     DECIMAL(4,2),
  punctuality_factor DECIMAL(4,2),
  completion_factor DECIMAL(4,2),
  calculated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scores_influencer ON influencer_scores(influencer_id, calculated_at DESC);

-- Log de sincronizaciones con el CRM de Byinfluence
CREATE TABLE IF NOT EXISTS crm_sync_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  synced_at       TIMESTAMPTZ DEFAULT NOW(),
  profiles_synced INT,
  errors          JSONB DEFAULT '[]',
  duration_ms     INT
);

-- Métricas agregadas mensuales por influencer (caché para los gráficos)
CREATE TABLE IF NOT EXISTS influencer_monthly_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id   UUID NOT NULL REFERENCES marketplace_users(id) ON DELETE CASCADE,
  year_month      TEXT NOT NULL,            -- formato 'YYYY-MM'
  collabs_count   INT DEFAULT 0,
  reach_total     INT DEFAULT 0,
  impressions     INT DEFAULT 0,
  interactions    INT DEFAULT 0,
  likes           INT DEFAULT 0,
  comments        INT DEFAULT 0,
  saves           INT DEFAULT 0,
  shares          INT DEFAULT 0,
  video_views     INT DEFAULT 0,
  stories_count   INT DEFAULT 0,
  story_views     INT DEFAULT 0,
  link_clicks     INT DEFAULT 0,
  avg_er          DECIMAL(5,2),
  UNIQUE(influencer_id, year_month)
);
CREATE INDEX IF NOT EXISTS idx_monthly_stats_influencer ON influencer_monthly_stats(influencer_id, year_month DESC);

-- RLS
ALTER TABLE influencer_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_monthly_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "influencer reads own scores" ON influencer_scores
  FOR SELECT USING (auth.uid() = influencer_id);

CREATE POLICY "influencer reads own monthly stats" ON influencer_monthly_stats
  FOR SELECT USING (auth.uid() = influencer_id);

-- Vista para calcular stats agregadas desde collaboration_deliveries
-- (útil para rellenar influencer_monthly_stats bajo demanda)
CREATE OR REPLACE VIEW v_influencer_delivery_stats AS
SELECT
  ca.creator_id AS influencer_id,
  TO_CHAR(cd.submitted_at, 'YYYY-MM') AS year_month,
  COUNT(*) AS collabs_count,
  COALESCE(SUM(cd.reach), 0) AS reach_total,
  COALESCE(SUM(cd.impressions), 0) AS impressions,
  COALESCE(SUM(cd.interactions), 0) AS interactions,
  COALESCE(SUM(cd.video_views), 0) AS video_views,
  COALESCE(SUM(cd.stories_count), 0) AS stories_count,
  COALESCE(SUM(cd.story_views_avg * cd.stories_count), 0) AS story_views,
  COALESCE(SUM(cd.link_clicks), 0) AS link_clicks,
  CASE
    WHEN SUM(cd.reach) > 0
    THEN ROUND((SUM(cd.interactions)::DECIMAL / NULLIF(SUM(cd.reach), 0)) * 100, 2)
    ELSE 0
  END AS avg_er
FROM collaboration_deliveries cd
JOIN collab_applications ca ON ca.id = cd.application_id
GROUP BY ca.creator_id, TO_CHAR(cd.submitted_at, 'YYYY-MM');
