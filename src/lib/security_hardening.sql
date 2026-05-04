-- ═══════════════════════════════════════════════════════════════════
-- SECURITY HARDENING — Connectly
-- Ejecutar en Supabase SQL Editor (es idempotente, se puede re-ejecutar)
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. HABILITAR RLS EN TODAS LAS TABLAS ────────────────────────────────────
ALTER TABLE IF EXISTS marketplace_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS brand_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS influencer_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS collaborations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS collab_applications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS escrow_payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credit_transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS unlocked_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ugc_projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ugc_deliveries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS collaboration_deliveries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS influencer_scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS influencer_monthly_stats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS plan_limits               ENABLE ROW LEVEL SECURITY;

-- ─── 2. marketplace_users ────────────────────────────────────────────────────
-- Cada usuario solo puede leer y editar su propia fila.
-- Para búsquedas públicas se usan las vistas v_*_profiles_public.
DROP POLICY IF EXISTS "users read own"   ON marketplace_users;
DROP POLICY IF EXISTS "users update own" ON marketplace_users;

CREATE POLICY "users read own" ON marketplace_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users update own" ON marketplace_users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── 3. brand_profiles ───────────────────────────────────────────────────────
-- El dueño lee TODO (datos fiscales incluidos).
-- Otros usuarios NUNCA acceden directamente — usan v_brand_profiles_public.
DROP POLICY IF EXISTS "brand reads own full profile"     ON brand_profiles;
DROP POLICY IF EXISTS "brand updates own profile"        ON brand_profiles;
DROP POLICY IF EXISTS "authenticated reads public brand" ON brand_profiles;

CREATE POLICY "brand reads own full profile" ON brand_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "brand updates own profile" ON brand_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 4. influencer_profiles ──────────────────────────────────────────────────
-- Igual: el dueño lee/edita todo. El resto usa v_influencer_profiles_public.
DROP POLICY IF EXISTS "influencer reads own full profile"     ON influencer_profiles;
DROP POLICY IF EXISTS "influencer updates own profile"        ON influencer_profiles;
DROP POLICY IF EXISTS "authenticated reads public influencer" ON influencer_profiles;

CREATE POLICY "influencer reads own full profile" ON influencer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "influencer updates own profile" ON influencer_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 5. VISTAS PÚBLICAS SIN DATOS SENSIBLES ──────────────────────────────────
-- security_invoker = on: la vista respeta el RLS del usuario que la llama,
-- no del definer. Esto evita bypassar RLS a través de vistas.

CREATE OR REPLACE VIEW v_brand_profiles_public
  WITH (security_invoker = on)
AS
SELECT
  id, user_id, brand_name, logo_url, sector, description,
  city, website, rating_avg, total_reviews, is_verified
FROM brand_profiles;
-- NO incluye: fiscal_name, fiscal_nif, fiscal_address, billing_email, is_claimed

CREATE OR REPLACE VIEW v_influencer_profiles_public
  WITH (security_invoker = on)
AS
SELECT
  id, user_id, display_name, bio, avatar_url, city,
  instagram_handle, tiktok_handle, followers_ig, followers_tt,
  niches, price_min, price_max, rating_avg, total_reviews,
  is_verified, creator_type
FROM influencer_profiles;
-- NO incluye: bank_iban, bank_holder_name, bank_verified,
--             fiscal_name, fiscal_nif, fiscal_address, billing_email

-- ─── 6. collaborations ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "brand manages own collabs"        ON collaborations;
DROP POLICY IF EXISTS "anyone reads active collabs"      ON collaborations;
DROP POLICY IF EXISTS "authenticated reads active collabs" ON collaborations;

CREATE POLICY "brand manages own collabs" ON collaborations
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM brand_profiles WHERE id = brand_profile_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM brand_profiles WHERE id = brand_profile_id
    )
  );

CREATE POLICY "authenticated reads active collabs" ON collaborations
  FOR SELECT USING (status = 'active');

-- ─── 7. collab_applications ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "creator inserts own application"         ON collab_applications;
DROP POLICY IF EXISTS "creator reads own applications"          ON collab_applications;
DROP POLICY IF EXISTS "brand reads applications to own collabs" ON collab_applications;
DROP POLICY IF EXISTS "brand updates application status"        ON collab_applications;

CREATE POLICY "creator inserts own application" ON collab_applications
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM influencer_profiles WHERE id = influencer_profile_id
    )
  );

CREATE POLICY "creator reads own applications" ON collab_applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM influencer_profiles WHERE id = influencer_profile_id
    )
  );

CREATE POLICY "brand reads applications to own collabs" ON collab_applications
  FOR SELECT USING (auth.uid() = brand_id);

CREATE POLICY "brand updates application status" ON collab_applications
  FOR UPDATE USING (auth.uid() = brand_id)
  WITH CHECK (auth.uid() = brand_id);

-- ─── 8. conversations ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "parties read own conversation" ON conversations;
DROP POLICY IF EXISTS "parties create conversation"   ON conversations;
DROP POLICY IF EXISTS "parties update conversation"   ON conversations;

CREATE POLICY "parties read own conversation" ON conversations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM brand_profiles WHERE id = brand_profile_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM influencer_profiles WHERE id = influencer_profile_id
    )
  );

CREATE POLICY "parties create conversation" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM brand_profiles WHERE id = brand_profile_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM influencer_profiles WHERE id = influencer_profile_id
    )
  );

CREATE POLICY "parties update conversation" ON conversations
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM brand_profiles WHERE id = brand_profile_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM influencer_profiles WHERE id = influencer_profile_id
    )
  );

-- ─── 9. messages ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "parties read conversation messages" ON messages;
DROP POLICY IF EXISTS "parties send message"               ON messages;
DROP POLICY IF EXISTS "parties update message read"        ON messages;

CREATE POLICY "parties read conversation messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (
          auth.uid() IN (SELECT user_id FROM brand_profiles      WHERE id = c.brand_profile_id)
          OR
          auth.uid() IN (SELECT user_id FROM influencer_profiles WHERE id = c.influencer_profile_id)
        )
    )
  );

CREATE POLICY "parties send message" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_user_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (
          auth.uid() IN (SELECT user_id FROM brand_profiles      WHERE id = c.brand_profile_id)
          OR
          auth.uid() IN (SELECT user_id FROM influencer_profiles WHERE id = c.influencer_profile_id)
        )
    )
  );

CREATE POLICY "parties mark message read" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (
          auth.uid() IN (SELECT user_id FROM brand_profiles      WHERE id = c.brand_profile_id)
          OR
          auth.uid() IN (SELECT user_id FROM influencer_profiles WHERE id = c.influencer_profile_id)
        )
    )
  );

-- ─── 10. escrow_payments — cliente solo lee, NUNCA escribe ───────────────────
-- INSERT/UPDATE/DELETE solo desde service_role (webhook, cron). Bypasea RLS.
DROP POLICY IF EXISTS "parties read own escrow" ON escrow_payments;

CREATE POLICY "parties read own escrow" ON escrow_payments
  FOR SELECT USING (
    auth.uid() = payer_user_id OR auth.uid() = payee_user_id
  );

-- ─── 11. invoices — cliente solo lee sus propias facturas ────────────────────
DROP POLICY IF EXISTS "user reads own invoices" ON invoices;

CREATE POLICY "user reads own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

-- ─── 12. subscriptions — cliente solo lee su propia suscripción ──────────────
DROP POLICY IF EXISTS "user reads own subscription" ON subscriptions;

CREATE POLICY "user reads own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ─── 13. credit_transactions — cliente solo lee, INSERT via RPC ──────────────
DROP POLICY IF EXISTS "user reads own credit transactions" ON credit_transactions;

CREATE POLICY "user reads own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ─── 14. unlocked_profiles ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "user reads own unlocks" ON unlocked_profiles;

CREATE POLICY "user reads own unlocks" ON unlocked_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- ─── 15. ugc_projects ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "brand manages own ugc projects"      ON ugc_projects;
DROP POLICY IF EXISTS "creator reads assigned ugc projects" ON ugc_projects;

CREATE POLICY "brand manages own ugc projects" ON ugc_projects
  FOR ALL USING (auth.uid() = brand_id)
  WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "creator reads assigned ugc projects" ON ugc_projects
  FOR SELECT USING (auth.uid() = creator_id);

-- ─── 16. ugc_deliveries ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "creator manages own ugc deliveries"           ON ugc_deliveries;
DROP POLICY IF EXISTS "brand reads ugc deliveries for own projects"  ON ugc_deliveries;

CREATE POLICY "creator manages own ugc deliveries" ON ugc_deliveries
  FOR ALL USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "brand reads ugc deliveries for own projects" ON ugc_deliveries
  FOR SELECT USING (
    auth.uid() IN (
      SELECT brand_id FROM ugc_projects WHERE id = project_id
    )
  );

-- ─── 17. reviews ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "reviewer inserts own review" ON reviews;
DROP POLICY IF EXISTS "parties read reviews"        ON reviews;

CREATE POLICY "reviewer inserts own review" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "parties read reviews" ON reviews
  FOR SELECT USING (
    auth.uid() = reviewer_id OR auth.uid() = reviewed_id
  );

-- ─── 18. collaboration_deliveries ────────────────────────────────────────────
DROP POLICY IF EXISTS "influencer inserts own delivery"     ON collaboration_deliveries;
DROP POLICY IF EXISTS "parties can read delivery"           ON collaboration_deliveries;
DROP POLICY IF EXISTS "influencer reads own delivery"       ON collaboration_deliveries;
DROP POLICY IF EXISTS "brand reads delivery for own collab" ON collaboration_deliveries;

CREATE POLICY "influencer inserts own delivery" ON collaboration_deliveries
  FOR INSERT WITH CHECK (auth.uid() = influencer_id);

CREATE POLICY "influencer reads own delivery" ON collaboration_deliveries
  FOR SELECT USING (auth.uid() = influencer_id);

CREATE POLICY "brand reads delivery for own collab" ON collaboration_deliveries
  FOR SELECT USING (
    auth.uid() IN (
      SELECT brand_id FROM collab_applications WHERE id = application_id
    )
  );

-- ─── 19. notifications — CRÍTICO: eliminar INSERT público ────────────────────
-- Antes: WITH CHECK (true) = cualquier usuario insertaba notificaciones para
--        cualquier user_id. Ahora solo service_role puede insertar.
DROP POLICY IF EXISTS "system inserts notifications"      ON notifications;
DROP POLICY IF EXISTS "user reads own notifications"      ON notifications;
DROP POLICY IF EXISTS "user marks read"                   ON notifications;
DROP POLICY IF EXISTS "user marks own notification read"  ON notifications;

CREATE POLICY "user reads own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user marks own notification read" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND read = true);

-- ─── 20. influencer_scores / influencer_monthly_stats ────────────────────────
DROP POLICY IF EXISTS "influencer reads own scores"       ON influencer_scores;
DROP POLICY IF EXISTS "influencer reads own monthly stats" ON influencer_monthly_stats;

CREATE POLICY "influencer reads own scores" ON influencer_scores
  FOR SELECT USING (auth.uid() = influencer_id);

CREATE POLICY "influencer reads own monthly stats" ON influencer_monthly_stats
  FOR SELECT USING (auth.uid() = influencer_id);

-- ─── 21. plan_limits — lectura pública para cualquier usuario autenticado ────
DROP POLICY IF EXISTS "authenticated reads plan limits" ON plan_limits;

CREATE POLICY "authenticated reads plan limits" ON plan_limits
  FOR SELECT USING (auth.role() = 'authenticated');

-- ─── 22. CORRECCIÓN CRÍTICA: unlock_profile ──────────────────────────────────
-- Antes: cualquier usuario podía pasar un p_user_id ajeno y gastar sus créditos.
-- Ahora: verificamos que auth.uid() == p_user_id antes de hacer nada.
CREATE OR REPLACE FUNCTION unlock_profile(
  p_user_id       UUID,
  p_influencer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits        INT;
  v_already        BOOLEAN;
  v_credits_after  INT;
BEGIN
  -- SEGURIDAD: solo el propio usuario puede gastar sus créditos
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'unauthorized');
  END IF;

  -- 1. Verificar créditos actuales
  SELECT credits INTO v_credits
  FROM marketplace_users
  WHERE id = p_user_id;

  IF v_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'user_not_found');
  END IF;

  -- 2. Verificar si ya estaba desbloqueado (no cobrar dos veces)
  SELECT EXISTS (
    SELECT 1 FROM unlocked_profiles
    WHERE user_id = p_user_id
      AND influencer_profile_id = p_influencer_id
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object(
      'success', true,
      'error_code', 'already_unlocked',
      'credits_remaining', v_credits
    );
  END IF;

  -- 3. Verificar créditos suficientes
  IF v_credits < 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'insufficient_credits',
      'credits_remaining', v_credits
    );
  END IF;

  -- 4. Registrar transacción (el trigger descuenta los créditos)
  INSERT INTO credit_transactions (user_id, amount, concept, related_id)
  VALUES (p_user_id, -10, 'unlock_profile', p_influencer_id);

  -- 5. Registrar desbloqueo
  INSERT INTO unlocked_profiles (user_id, influencer_profile_id)
  VALUES (p_user_id, p_influencer_id);

  -- 6. Leer créditos actualizados
  SELECT credits INTO v_credits_after
  FROM marketplace_users
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'credits_remaining', v_credits_after
  );
END;
$$;

-- ─── 23. Vista analytics — SECURITY INVOKER para respetar RLS ────────────────
-- Antes: se ejecutaba con permisos del definer, potencialmente bypassando RLS.
CREATE OR REPLACE VIEW v_influencer_delivery_stats
  WITH (security_invoker = on)
AS
SELECT
  cd.influencer_id,
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
GROUP BY cd.influencer_id, TO_CHAR(cd.submitted_at, 'YYYY-MM');
