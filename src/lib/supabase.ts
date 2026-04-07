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

// ─── Collab Applications ─────────────────────────────────────────────────────

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface CollabApplication {
  id: string;
  collab_id: string;
  creator_id: string;
  brand_id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
}

export interface ApplicationWithCollab extends CollabApplication {
  collab: {
    id: string;
    title: string;
    type: string;
    budget: number | null;
    brand: { display_name: string } | null;
  } | null;
}

export interface ApplicationWithCreator extends CollabApplication {
  creator: {
    id: string;
    display_name: string;
    city: string | null;
    niche: string | null;
  } | null;
  collab: {
    id: string;
    title: string;
    type: string;
    budget: number | null;
  } | null;
}

/** Aplica a una colaboración. Devuelve error_code si falla. */
export async function applyToCollab(
  creatorId: string,
  collabId: string,
  message?: string,
): Promise<{ success: boolean; error_code?: string }> {
  // Leer brand_id de la colaboración
  const { data: collab, error: collabErr } = await supabase
    .from('collabs')
    .select('brand_id')
    .eq('id', collabId)
    .single();

  if (collabErr || !collab) {
    return { success: false, error_code: 'collab_not_found' };
  }

  const { error } = await supabase.from('collab_applications').insert({
    collab_id: collabId,
    creator_id: creatorId,
    brand_id: collab.brand_id,
    message: message?.trim() || null,
    status: 'pending',
  });

  if (error) {
    if (error.code === '23505') return { success: false, error_code: 'already_applied' };
    return { success: false, error_code: error.message };
  }
  return { success: true };
}

/** Comprueba si el creador ya ha aplicado a esta colaboración. */
export async function hasApplied(creatorId: string, collabId: string): Promise<boolean> {
  const { data } = await supabase
    .from('collab_applications')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('collab_id', collabId)
    .maybeSingle();
  return !!data;
}

/** Todas las aplicaciones del creador (para su dashboard). */
export async function getApplicationsByCreator(creatorId: string): Promise<ApplicationWithCollab[]> {
  const { data, error } = await supabase
    .from('collab_applications')
    .select(`
      id, collab_id, creator_id, brand_id, status, message, created_at,
      collab:collabs!collab_id (
        id, title, type, budget,
        brand:marketplace_users!brand_id ( display_name )
      )
    `)
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ApplicationWithCollab[];
}

/** Todos los candidatos a las colaboraciones de la marca. */
export async function getApplicationsByBrand(brandId: string): Promise<ApplicationWithCreator[]> {
  const { data, error } = await supabase
    .from('collab_applications')
    .select(`
      id, collab_id, creator_id, brand_id, status, message, created_at,
      creator:marketplace_users!creator_id ( id, display_name, city, niche ),
      collab:collabs!collab_id ( id, title, type, budget )
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ApplicationWithCreator[];
}

/** La marca acepta o rechaza una aplicación. */
export async function updateApplicationStatus(
  appId: string,
  status: 'accepted' | 'rejected',
  brandId: string,
): Promise<void> {
  const { error } = await supabase
    .from('collab_applications')
    .update({ status })
    .eq('id', appId)
    .eq('brand_id', brandId); // RLS extra: solo la marca propietaria puede actualizar
  if (error) throw error;
}
