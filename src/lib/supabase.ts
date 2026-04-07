import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente singleton para uso en el navegador
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ─── Helpers tipados ────────────────────────────────────────

/** Usuario autenticado actual */
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Perfil de marketplace del usuario actual */
export async function getMarketplaceUser(userId: string) {
  const { data, error } = await supabase
    .from('marketplace_users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

/** Créditos actuales del usuario */
export async function getUserCredits(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('marketplace_users')
    .select('credits')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data?.credits ?? 0;
}

/** Devuelve todos los influencer_profile_id ya desbloqueados por el usuario */
export async function getUnlockedProfileIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('unlocked_profiles')
    .select('influencer_profile_id')
    .eq('user_id', userId);
  return (data ?? []).map(r => r.influencer_profile_id as string);
}

/** Comprueba si un perfil ya está desbloqueado por este usuario */
export async function isProfileUnlocked(userId: string, influencerProfileId: string): Promise<boolean> {
  const { data } = await supabase
    .from('unlocked_profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('influencer_profile_id', influencerProfileId)
    .maybeSingle();
  return !!data;
}

/**
 * Desbloquea un perfil gastando 10 créditos.
 * Usa una transacción RPC para que sea atómica.
 * La función SQL se llama unlock_profile(p_user_id, p_influencer_id).
 */
export async function unlockProfile(userId: string, influencerProfileId: string) {
  const { data, error } = await supabase.rpc('unlock_profile', {
    p_user_id: userId,
    p_influencer_id: influencerProfileId,
  });
  if (error) throw error;
  return data; // { success, credits_remaining, error_code? }
}
