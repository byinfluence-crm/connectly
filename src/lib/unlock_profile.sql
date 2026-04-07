-- ============================================================
-- RPC: unlock_profile
-- Desbloquea un perfil de influencer gastando 10 créditos.
-- Atómica: si no hay créditos suficientes, no hace nada.
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

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
