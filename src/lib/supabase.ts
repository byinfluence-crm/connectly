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

// ─── Perfiles públicos ───────────────────────────────────────────────────────

export interface PublicProfile {
  id: string;
  user_type: 'brand' | 'influencer';
  display_name: string;
  city: string | null;
  niche: string | null;
  is_verified: boolean;
  is_boosted: boolean;
  created_at: string;
  rating_avg: number;
  total_reviews: number;
  // Influencer-specific
  bio: string | null;
  avatar_url: string | null;
  followers_ig: number;
  engagement_rate_ig: number | null;
  price_min: number | null;
  price_max: number | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  niches: string[];
  creator_type: 'influencer' | 'ugc' | 'both' | null;
  portfolio_urls: string[];
  // Brand-specific
  logo_url: string | null;
  cover_photo_url: string | null;
  description: string | null;
  website: string | null;
  collab_brief: string | null;
}

/** Perfil público de cualquier usuario (une marketplace_users + profile específico). */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data: mu, error } = await supabase
    .from('marketplace_users')
    .select('id, user_type, display_name, city, niche, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error || !mu) return null;

  const base = {
    id: mu.id,
    user_type: mu.user_type as 'brand' | 'influencer',
    display_name: mu.display_name ?? '',
    city: mu.city,
    niche: mu.niche,
    is_verified: false,
    is_boosted: false,
    created_at: mu.created_at ?? '',
    rating_avg: 0,
    total_reviews: 0,
    bio: null, avatar_url: null, followers_ig: 0, engagement_rate_ig: null,
    price_min: null, price_max: null, instagram_handle: null, tiktok_handle: null,
    niches: [], creator_type: null, portfolio_urls: [],
    logo_url: null, cover_photo_url: null, description: null, website: null, collab_brief: null,
  };

  if (mu.user_type === 'brand') {
    const { data: bp } = await supabase
      .from('brand_profiles')
      .select('is_verified, is_boosted, logo_url, cover_photo_url, description, website, collab_brief, rating_avg, total_reviews')
      .eq('user_id', userId)
      .maybeSingle();
    return {
      ...base,
      is_verified: bp?.is_verified ?? false,
      is_boosted: bp?.is_boosted ?? false,
      logo_url: bp?.logo_url ?? null,
      cover_photo_url: bp?.cover_photo_url ?? null,
      description: bp?.description ?? null,
      website: bp?.website ?? null,
      collab_brief: bp?.collab_brief ?? null,
      rating_avg: bp?.rating_avg ?? 0,
      total_reviews: bp?.total_reviews ?? 0,
    };
  }

  if (mu.user_type === 'influencer') {
    const { data: ip } = await supabase
      .from('influencer_profiles')
      .select('is_verified, is_boosted, bio, avatar_url, followers_ig, engagement_rate_ig, price_min, price_max, instagram_handle, tiktok_handle, niches, creator_type, rating_avg, total_reviews, portfolio_urls')
      .eq('user_id', userId)
      .maybeSingle();
    return {
      ...base,
      is_verified: ip?.is_verified ?? false,
      is_boosted: ip?.is_boosted ?? false,
      bio: ip?.bio ?? null,
      avatar_url: ip?.avatar_url ?? null,
      followers_ig: ip?.followers_ig ?? 0,
      engagement_rate_ig: ip?.engagement_rate_ig ?? null,
      price_min: ip?.price_min ?? null,
      price_max: ip?.price_max ?? null,
      instagram_handle: ip?.instagram_handle ?? null,
      tiktok_handle: ip?.tiktok_handle ?? null,
      niches: ip?.niches ?? [],
      creator_type: ip?.creator_type ?? null,
      rating_avg: ip?.rating_avg ?? 0,
      total_reviews: ip?.total_reviews ?? 0,
      portfolio_urls: ip?.portfolio_urls ?? [],
    };
  }

  return base;
}

// ─── Brand / Influencer Profiles ────────────────────────────────────────────

export interface BrandLocation {
  name: string;
  address: string;
  city: string;
  maps_url?: string;
}

export interface BrandProfile {
  id: string;
  user_id: string;
  brand_name: string;
  logo_url: string | null;
  cover_photo_url: string | null;
  gallery_urls: string[];
  sector: string | null;
  cuisine_type: string | null;
  description: string | null;
  collab_brief: string | null;
  city: string | null;
  website: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  price_range: '€' | '€€' | '€€€' | '€€€€' | null;
  schedule: string | null;
  locations: BrandLocation[];
  rating_avg: number;
  total_reviews: number;
  is_verified: boolean;
  is_claimed: boolean;
  fiscal_name: string | null;
  fiscal_nif: string | null;
  fiscal_address: string | null;
  billing_email: string | null;
}

export async function updateBrandProfile(
  userId: string,
  data: Partial<Omit<BrandProfile, 'id' | 'user_id' | 'rating_avg' | 'total_reviews' | 'is_verified' | 'is_claimed'>>,
): Promise<void> {
  const { error } = await supabase
    .from('brand_profiles')
    .update(data)
    .eq('user_id', userId);
  if (error) throw error;
}

export interface InfluencerProfile {
  id: string;
  user_id: string | null;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  followers_ig: number;
  followers_tt: number;
  niches: string[];
  price_min: number | null;
  price_max: number | null;
  rating_avg: number;
  total_reviews: number;
  is_verified: boolean;
  is_claimed: boolean;
  creator_type: 'influencer' | 'ugc' | 'both';
  portfolio_urls: string[];
  engagement_rate_ig: number | null;
  bank_iban: string | null;
  bank_holder_name: string | null;
  bank_verified: boolean;
  fiscal_name: string | null;
  fiscal_nif: string | null;
  fiscal_address: string | null;
  billing_email: string | null;
}

/** Profile de marca asociado a un user_id (creado automáticamente por trigger). */
export async function getBrandProfileByUserId(userId: string): Promise<BrandProfile | null> {
  const { data } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as BrandProfile | null;
}

/** Profile de influencer asociado a un user_id (creado automáticamente por trigger). */
export async function getInfluencerProfileByUserId(userId: string): Promise<InfluencerProfile | null> {
  const { data } = await supabase
    .from('influencer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as InfluencerProfile | null;
}

// ─── Collaborations ──────────────────────────────────────────────────────────

export interface Collaboration {
  id: string;
  brand_profile_id: string;
  title: string;
  description: string | null;
  collab_type: 'canje' | 'pago' | 'mixto';
  budget_min: number | null;
  budget_max: number | null;
  niches_required: string[];
  min_followers: number;
  city: string | null;
  status: 'draft' | 'active' | 'closed' | 'expired';
  is_boosted: boolean;
  boost_expires_at: string | null;
  deadline: string | null;
  requirements: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollaborationInput {
  title: string;
  description?: string;
  collab_type: 'canje' | 'pago' | 'mixto';
  budget_min?: number;
  budget_max?: number;
  niches_required: string[];
  min_followers?: number;
  city?: string;
  deadline?: string;
  requirements?: string;
  status?: 'draft' | 'active';
}

/** Crea una colaboración. Resuelve el brand_profile_id a partir del user_id. */
export async function createCollaboration(
  userId: string,
  input: CollaborationInput,
): Promise<Collaboration> {
  const profile = await getBrandProfileByUserId(userId);
  if (!profile) throw new Error('Brand profile no encontrado. Contacta con soporte.');

  const { data, error } = await supabase
    .from('collaborations')
    .insert({
      brand_profile_id: profile.id,
      title: input.title,
      description: input.description ?? null,
      collab_type: input.collab_type,
      budget_min: input.budget_min ?? null,
      budget_max: input.budget_max ?? null,
      niches_required: input.niches_required,
      min_followers: input.min_followers ?? 0,
      city: input.city ?? null,
      deadline: input.deadline ?? null,
      requirements: input.requirements ?? null,
      status: input.status ?? 'draft',
    })
    .select()
    .single();
  if (error) throw error;
  return data as Collaboration;
}

/** Lista las colaboraciones de una marca. */
export async function getCollaborationsByBrand(userId: string): Promise<Collaboration[]> {
  const profile = await getBrandProfileByUserId(userId);
  if (!profile) return [];
  const { data } = await supabase
    .from('collaborations')
    .select('*')
    .eq('brand_profile_id', profile.id)
    .order('created_at', { ascending: false });
  return (data ?? []) as Collaboration[];
}

/** Actualiza el estado de una colaboración (la RLS garantiza que solo la propietaria puede). */
export async function updateCollaborationStatus(
  collabId: string,
  status: 'draft' | 'active' | 'closed',
): Promise<void> {
  const { error } = await supabase
    .from('collaborations')
    .update({ status })
    .eq('id', collabId);
  if (error) throw error;
}

/** Elimina una colaboración. */
export async function deleteCollaboration(collabId: string): Promise<void> {
  const { error } = await supabase
    .from('collaborations')
    .delete()
    .eq('id', collabId);
  if (error) throw error;
}

/** Actualiza los campos editables de una colaboración. */
export async function updateCollaboration(
  collabId: string,
  input: Partial<CollaborationInput>,
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.collab_type !== undefined) patch.collab_type = input.collab_type;
  if (input.budget_min !== undefined) patch.budget_min = input.budget_min ?? null;
  if (input.budget_max !== undefined) patch.budget_max = input.budget_max ?? null;
  if (input.niches_required !== undefined) patch.niches_required = input.niches_required;
  if (input.city !== undefined) patch.city = input.city ?? null;
  if (input.deadline !== undefined) patch.deadline = input.deadline ?? null;
  if (input.requirements !== undefined) patch.requirements = input.requirements ?? null;
  if (input.min_followers !== undefined) patch.min_followers = input.min_followers ?? 0;
  const { error } = await supabase
    .from('collaborations')
    .update(patch)
    .eq('id', collabId);
  if (error) throw error;
}

// ─── Discover — Influencer Profiles ────────────────────────────────────────

/** Perfil público de influencer/UGC para /discover */
export interface PublicInfluencerProfile {
  id: string;
  user_id: string;
  display_name: string;
  instagram_handle: string | null;
  niches: string[];
  niche: string | null;
  city: string | null;
  followers_ig: number;
  engagement_rate_ig: number | null;
  price_min: number | null;
  price_max: number | null;
  is_verified: boolean;
  is_boosted: boolean;
  rating_avg: number;
  total_reviews: number;
  creator_type: 'influencer' | 'ugc' | 'both';
  avatar_url: string | null;
  bio: string | null;
  portfolio_urls: string[];
}

export async function getPublicInfluencers(): Promise<PublicInfluencerProfile[]> {
  const { data } = await supabase
    .from('influencer_profiles')
    .select('id, user_id, display_name, instagram_handle, niches, city, followers_ig, followers_tt, engagement_rate_ig, price_min, price_max, is_verified, is_boosted, rating_avg, total_reviews, creator_type, avatar_url, bio, portfolio_urls')
    .in('creator_type', ['influencer', 'both'])
    .not('instagram_handle', 'is', null)
    .gt('followers_ig', 0)
    .order('is_verified', { ascending: false })
    .order('rating_avg', { ascending: false })
    .order('total_reviews', { ascending: false });
  return (data ?? []).map(d => ({ ...d, niche: d.niches?.[0] ?? null, portfolio_urls: d.portfolio_urls ?? [] })) as unknown as PublicInfluencerProfile[];
}

export async function getPublicUgcCreators(): Promise<PublicInfluencerProfile[]> {
  const { data } = await supabase
    .from('influencer_profiles')
    .select('id, user_id, display_name, instagram_handle, niches, city, followers_ig, engagement_rate_ig, price_min, price_max, is_verified, is_boosted, rating_avg, total_reviews, creator_type, avatar_url, bio, portfolio_urls')
    .in('creator_type', ['ugc', 'both'])
    .order('is_verified', { ascending: false })
    .order('rating_avg', { ascending: false })
    .order('total_reviews', { ascending: false });
  return (data ?? []).map(d => ({ ...d, niche: d.niches?.[0] ?? null, portfolio_urls: d.portfolio_urls ?? [] })) as unknown as PublicInfluencerProfile[];
}

/** Tipo para mostrar collabs en /discover con datos de la marca. */
export interface PublicCollaboration extends Collaboration {
  brand: {
    id: string;
    brand_name: string;
    logo_url: string | null;
    city: string | null;
    sector: string | null;
    is_verified: boolean;
  } | null;
}

/** Lista colaboraciones activas públicamente visibles (para /discover). */
export async function getPublicCollaborations(filters?: {
  niche?: string;
  city?: string;
  type?: 'canje' | 'pago' | 'mixto';
}): Promise<PublicCollaboration[]> {
  let query = supabase
    .from('collaborations')
    .select(`
      *,
      brand:brand_profiles!brand_profile_id (
        id, brand_name, logo_url, city, sector, is_verified
      )
    `)
    .eq('status', 'active')
    .order('is_boosted', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.city) query = query.eq('city', filters.city);
  if (filters?.type) query = query.eq('collab_type', filters.type);
  if (filters?.niche) query = query.contains('niches_required', [filters.niche]);

  const { data } = await query;
  return (data ?? []) as unknown as PublicCollaboration[];
}

/** Una colaboración concreta con datos públicos de la marca. */
export async function getPublicCollaboration(collabId: string): Promise<PublicCollaboration | null> {
  const { data } = await supabase
    .from('collaborations')
    .select(`
      *,
      brand:brand_profiles!brand_profile_id (
        id, brand_name, logo_url, city, sector, is_verified
      )
    `)
    .eq('id', collabId)
    .maybeSingle();
  return data as unknown as PublicCollaboration | null;
}

/** Colaboraciones activas de una marca (para su perfil público). */
export async function getBrandActiveCollabs(brandUserId: string): Promise<PublicCollaboration[]> {
  const profile = await getBrandProfileByUserId(brandUserId);
  if (!profile) return [];
  const { data } = await supabase
    .from('collaborations')
    .select(`
      *,
      brand:brand_profiles!brand_profile_id (
        id, brand_name, logo_url, city, sector, is_verified
      )
    `)
    .eq('brand_profile_id', profile.id)
    .eq('status', 'active')
    .order('is_boosted', { ascending: false });
  return (data ?? []) as unknown as PublicCollaboration[];
}

// ─── Collab Applications ─────────────────────────────────────────────────────

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface CollabApplication {
  id: string;
  collaboration_id: string;
  influencer_profile_id: string;
  brand_id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
}

export interface ApplicationWithCollab extends CollabApplication {
  collab_status?: string | null;
  collab: {
    id: string;
    title: string;
    collab_type: 'canje' | 'pago' | 'mixto';
    budget_min: number | null;
    budget_max: number | null;
    brand: { id: string; brand_name: string; user_id: string | null } | null;
  } | null;
}

export interface ApplicationWithCreator extends CollabApplication {
  collab_status?: string | null;
  creator: {
    id: string;
    user_id: string | null;
    display_name: string;
    city: string | null;
    niches: string[] | null;
    avatar_url: string | null;
  } | null;
  collab: {
    id: string;
    title: string;
    collab_type: 'canje' | 'pago' | 'mixto';
    budget_min: number | null;
    budget_max: number | null;
  } | null;
}

/**
 * Resuelve el influencer_profile_id desde el marketplace_users.id (auth uid).
 * El profile se crea automáticamente al registrarse vía trigger.
 * Devuelve null si no existe (no debería pasar si el user es influencer).
 */
async function resolveInfluencerProfileId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('influencer_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Resuelve el brand_profile_id desde el marketplace_users.id (auth uid).
 */
async function resolveBrandProfileUserId(brandProfileId: string): Promise<string | null> {
  const { data } = await supabase
    .from('brand_profiles')
    .select('user_id')
    .eq('id', brandProfileId)
    .maybeSingle();
  return (data as { user_id: string | null } | null)?.user_id ?? null;
}

/** Aplica a una colaboración. Devuelve error_code si falla. */
export async function applyToCollaboration(
  creatorUserId: string,
  collaborationId: string,
  message?: string,
): Promise<{ success: boolean; error_code?: string }> {
  const influencerProfileId = await resolveInfluencerProfileId(creatorUserId);
  if (!influencerProfileId) {
    return { success: false, error_code: 'creator_profile_not_found' };
  }

  // Obtener el brand_profile_id de la colaboración para derivar el brand_id (user_id)
  const { data: collab, error: collabErr } = await supabase
    .from('collaborations')
    .select('brand_profile_id')
    .eq('id', collaborationId)
    .maybeSingle();

  if (collabErr || !collab) {
    return { success: false, error_code: 'collab_not_found' };
  }

  const brandUserId = await resolveBrandProfileUserId(collab.brand_profile_id);
  if (!brandUserId) {
    return { success: false, error_code: 'brand_not_found' };
  }

  const { error } = await supabase.from('collab_applications').insert({
    collaboration_id: collaborationId,
    influencer_profile_id: influencerProfileId,
    brand_id: brandUserId,
    message: message?.trim() || null,
    status: 'pending',
  });

  if (error) {
    if (error.code === '23505') return { success: false, error_code: 'already_applied' };
    return { success: false, error_code: error.message };
  }
  return { success: true };
}

/** @deprecated Use applyToCollaboration instead. */
export const applyToCollab = applyToCollaboration;

/** Comprueba si el creador ya ha aplicado a esta colaboración. */
export async function hasApplied(creatorUserId: string, collaborationId: string): Promise<boolean> {
  const influencerProfileId = await resolveInfluencerProfileId(creatorUserId);
  if (!influencerProfileId) return false;
  const { data } = await supabase
    .from('collab_applications')
    .select('id')
    .eq('influencer_profile_id', influencerProfileId)
    .eq('collaboration_id', collaborationId)
    .maybeSingle();
  return !!data;
}

/** Todas las aplicaciones del creador (para su dashboard). */
export async function getApplicationsByCreator(creatorUserId: string): Promise<ApplicationWithCollab[]> {
  const influencerProfileId = await resolveInfluencerProfileId(creatorUserId);
  if (!influencerProfileId) return [];

  const { data, error } = await supabase
    .from('collab_applications')
    .select(`
      id, collaboration_id, influencer_profile_id, brand_id, status, collab_status, message, created_at,
      collab:collaborations!collaboration_id (
        id, title, collab_type, budget_min, budget_max,
        brand:brand_profiles!brand_profile_id ( id, brand_name, user_id )
      )
    `)
    .eq('influencer_profile_id', influencerProfileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ApplicationWithCollab[];
}

/** Todos los candidatos a las colaboraciones de la marca. */
export async function getApplicationsByBrand(brandUserId: string): Promise<ApplicationWithCreator[]> {
  const { data, error } = await supabase
    .from('collab_applications')
    .select(`
      id, collaboration_id, influencer_profile_id, brand_id, status, collab_status, message, created_at,
      creator:influencer_profiles!influencer_profile_id ( id, user_id, display_name, city, niches, avatar_url ),
      collab:collaborations!collaboration_id ( id, title, collab_type, budget_min, budget_max )
    `)
    .eq('brand_id', brandUserId)
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

/** Datos de una aplicación concreta (para el chat). */
export async function getApplicationById(appId: string): Promise<{
  id: string;
  status: string;
  influencer_profile_id: string;
  brand_id: string;
  creator: { user_id: string | null; display_name: string } | null;
  brand: { display_name: string } | null;
  collab: { title: string } | null;
} | null> {
  const { data } = await supabase
    .from('collab_applications')
    .select(`
      id, status, influencer_profile_id, brand_id,
      creator:influencer_profiles!influencer_profile_id ( user_id, display_name ),
      brand:marketplace_users!brand_id ( display_name ),
      collab:collaborations!collaboration_id ( title )
    `)
    .eq('id', appId)
    .single();
  return data as typeof data & null;
}

// ─── Chat / Messages ──────────────────────────────────────────────────────────

export interface Message {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  content: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
}

/**
 * Resuelve o crea la conversación asociada a una aplicación aceptada.
 * La conversación conecta collaboration + influencer_profile + brand_profile.
 * Devuelve null si la aplicación no existe o no se pudo resolver el brand_profile.
 */
export async function getOrCreateConversationForApplication(
  applicationId: string,
): Promise<string | null> {
  // 1. Leer la aplicación
  const { data: app, error: appErr } = await supabase
    .from('collab_applications')
    .select('collaboration_id, influencer_profile_id, brand_id')
    .eq('id', applicationId)
    .maybeSingle();
  if (appErr || !app) return null;

  // 2. Resolver brand_profile_id desde brand_id (que es marketplace_users.id)
  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('user_id', app.brand_id)
    .maybeSingle();
  if (!brand) return null;

  // 3. Buscar conversación existente con los 3 IDs
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('collaboration_id', app.collaboration_id)
    .eq('influencer_profile_id', app.influencer_profile_id)
    .eq('brand_profile_id', brand.id)
    .maybeSingle();
  if (existing) return existing.id as string;

  // 4. Crear nueva conversación
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      collaboration_id: app.collaboration_id,
      influencer_profile_id: app.influencer_profile_id,
      brand_profile_id: brand.id,
    })
    .select('id')
    .single();
  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
  return created.id as string;
}

/** Historial de mensajes de una aplicación (resuelve conversation internamente). */
export async function getMessages(applicationId: string): Promise<Message[]> {
  const convId = await getOrCreateConversationForApplication(applicationId);
  if (!convId) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_user_id, content, attachment_url, is_read, created_at')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

/**
 * Devuelve el conversation_id asociado a una aplicación (para usar con Realtime).
 * Se crea automáticamente si no existe.
 */
export async function getConversationIdByApplication(
  applicationId: string,
): Promise<string | null> {
  return getOrCreateConversationForApplication(applicationId);
}

/** Envía un mensaje al chat de una aplicación. */
export async function sendMessage(
  applicationId: string,
  senderId: string,
  content: string,
): Promise<Message> {
  const convId = await getOrCreateConversationForApplication(applicationId);
  if (!convId) throw new Error('No se pudo obtener la conversación');

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: convId, sender_user_id: senderId, content })
    .select('id, conversation_id, sender_user_id, content, attachment_url, is_read, created_at')
    .single();
  if (error) throw error;

  // Actualizar timestamp de última actividad de la conversación
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', convId);

  return data as Message;
}

// ─── Deliveries ───────────────────────────────────────────────────────────────

export interface CollabDelivery {
  id: string;
  application_id: string;
  influencer_id: string;
  post_urls: string[];
  content_types: string[];
  reach: number | null;
  impressions: number | null;
  interactions: number | null;
  video_views: number | null;
  stories_count: number | null;
  story_views_avg: number | null;
  link_clicks: number | null;
  story_replies: number | null;
  sticker_taps: number | null;
  submitted_at: string;
}

export interface DeliveryInput {
  post_urls: string[];
  content_types: string[];
  reach?: number;
  impressions?: number;
  interactions?: number;
  video_views?: number;
  stories_count?: number;
  story_views_avg?: number;
  link_clicks?: number;
  story_replies?: number;
  sticker_taps?: number;
}

/** Guarda la entrega del influencer y actualiza el estado de la aplicación. */
export async function submitDelivery(
  applicationId: string,
  influencerId: string,
  data: DeliveryInput,
): Promise<void> {
  const { error: delErr } = await supabase
    .from('collaboration_deliveries')
    .insert({ application_id: applicationId, influencer_id: influencerId, ...data });
  if (delErr) throw delErr;

  const { error: statusErr } = await supabase
    .from('collab_applications')
    .update({ collab_status: 'pending_brand_review' })
    .eq('id', applicationId);
  if (statusErr) throw statusErr;
}

/** Obtiene la entrega de una aplicación (para que la vea la marca). */
export async function getDelivery(applicationId: string): Promise<CollabDelivery | null> {
  const { data } = await supabase
    .from('collaboration_deliveries')
    .select('*')
    .eq('application_id', applicationId)
    .maybeSingle();
  return data as CollabDelivery | null;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  application_id: string | null;
  reviewer_id: string;
  reviewed_id: string;
  reviewer_role: 'brand' | 'influencer';
  rating: number;
  rating_communication: number | null;
  rating_professionalism: number | null;
  rating_results: number | null;
  would_repeat: boolean | null;
  comment: string | null;
  created_at: string;
  reviewer?: { display_name: string } | null;
}

export interface InfluencerReviewInput {
  rating: number;
  rating_communication: number;
  rating_professionalism: number;
  rating_results: number;
  would_repeat: boolean;
  comment: string;
}

export interface BrandReviewInput {
  rating: number;
  rating_communication: number;
  rating_professionalism: number;
  rating_results: number;
  would_repeat: boolean;
  comment: string;
}

/**
 * El influencer deja su reseña sobre la marca.
 * Internamente también crea la notificación para la marca.
 */
export async function submitInfluencerReview(
  applicationId: string,
  influencerId: string,
  brandId: string,
  input: InfluencerReviewInput,
): Promise<void> {
  const { error } = await supabase.from('reviews').insert({
    application_id: applicationId,
    reviewer_id: influencerId,
    reviewed_id: brandId,
    reviewer_role: 'influencer',
    ...input,
  });
  if (error) throw error;

  // Notificación a la marca
  await supabase.from('notifications').insert({
    user_id: brandId,
    type: 'pending_brand_review',
    title: 'El creador ha completado la colaboración',
    body: 'Ha dejado una reseña sobre tu marca. Para ver los resultados y estadísticas, deja tu valoración del creador.',
    data: { application_id: applicationId },
  });
}

/**
 * La marca deja su reseña sobre el influencer.
 * Marca la colaboración como completada y notifica al influencer.
 */
export async function submitBrandReview(
  applicationId: string,
  brandId: string,
  influencerId: string,
  input: BrandReviewInput,
): Promise<void> {
  const { error } = await supabase.from('reviews').insert({
    application_id: applicationId,
    reviewer_id: brandId,
    reviewed_id: influencerId,
    reviewer_role: 'brand',
    ...input,
  });
  if (error) throw error;

  // Marcar colaboración como completada
  const { error: statusErr } = await supabase
    .from('collab_applications')
    .update({ collab_status: 'completed' })
    .eq('id', applicationId);
  if (statusErr) throw statusErr;

  // Notificación al influencer
  await supabase.from('notifications').insert({
    user_id: influencerId,
    type: 'review_published',
    title: 'La marca ha valorado tu colaboración',
    body: 'Tu reseña y la de la marca ya son públicas en tu perfil. ¡Sigue sumando!',
    data: { application_id: applicationId },
  });
}

/** Reseñas reales de marcas sobre un creador (para /creators/[id]). */
export async function getReviewsForCreator(creatorId: string): Promise<Review[]> {
  const { data } = await supabase
    .from('reviews')
    .select(`
      id, application_id, reviewer_id, reviewed_id, reviewer_role,
      rating, rating_communication, rating_professionalism, rating_results,
      would_repeat, comment, created_at,
      reviewer:marketplace_users!reviewer_id ( display_name )
    `)
    .eq('reviewed_id', creatorId)
    .eq('reviewer_role', 'brand')
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as Review[];
}

/** Reseñas reales de creadores sobre una marca (para /brands/[id]). */
export async function getReviewsForBrand(brandId: string): Promise<Review[]> {
  const { data } = await supabase
    .from('reviews')
    .select(`
      id, application_id, reviewer_id, reviewed_id, reviewer_role,
      rating, rating_communication, rating_professionalism, rating_results,
      would_repeat, comment, created_at,
      reviewer:marketplace_users!reviewer_id ( display_name )
    `)
    .eq('reviewed_id', brandId)
    .eq('reviewer_role', 'influencer')
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as Review[];
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface MonthlyStats {
  year_month: string;
  collabs_count: number;
  reach_total: number;
  impressions: number;
  interactions: number;
  video_views: number;
  stories_count: number;
  story_views: number;
  link_clicks: number;
  avg_er: number;
}

export interface InfluencerScore {
  score: number;
  engagement_factor: number | null;
  rating_factor: number | null;
  punctuality_factor: number | null;
  completion_factor: number | null;
  calculated_at: string;
}

/** Stats mensuales del influencer desde la vista de Supabase. */
export async function getInfluencerMonthlyStats(influencerId: string): Promise<MonthlyStats[]> {
  const { data } = await supabase
    .from('v_influencer_delivery_stats')
    .select('*')
    .eq('influencer_id', influencerId)
    .order('year_month', { ascending: false })
    .limit(12);
  return (data ?? []) as MonthlyStats[];
}

/** Último score calculado del influencer. */
export async function getInfluencerScore(influencerId: string): Promise<InfluencerScore | null> {
  const { data } = await supabase
    .from('influencer_scores')
    .select('*')
    .eq('influencer_id', influencerId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as InfluencerScore | null;
}

/** Historial de entregas del influencer con collab info. */
export async function getInfluencerDeliveries(influencerId: string) {
  const { data } = await supabase
    .from('collaboration_deliveries')
    .select(`
      id, submitted_at, post_urls, content_types,
      reach, impressions, interactions, video_views,
      stories_count, story_views_avg, link_clicks,
      application:collab_applications!application_id (
        collab:collaborations!collaboration_id ( title, collab_type ),
        brand:marketplace_users!brand_id ( display_name )
      )
    `)
    .eq('influencer_id', influencerId)
    .order('submitted_at', { ascending: false });
  return (data ?? []) as unknown as {
    id: string;
    submitted_at: string;
    post_urls: string[];
    content_types: string[];
    reach: number | null;
    impressions: number | null;
    interactions: number | null;
    video_views: number | null;
    stories_count: number | null;
    story_views_avg: number | null;
    link_clicks: number | null;
    application: {
      collab: { title: string; collab_type: string } | null;
      brand: { display_name: string } | null;
    } | null;
  }[];
}

// ─── UGC Projects ─────────────────────────────────────────────────────────────

import type { UgcProject, UgcProjectStatus, UgcDelivery } from '@/types';

export interface UgcProjectInput {
  title: string;
  description?: string;
  content_types: string[];
  deliverables_count: number;
  budget_cents?: number;
  deadline?: string;
  usage_rights: 'brand_owned' | 'shared' | 'licensed';
  revision_limit: number;
  reference_urls?: string[];
  notes?: string;
}

export async function createUgcProject(
  brandId: string,
  input: UgcProjectInput,
): Promise<UgcProject> {
  const { data, error } = await supabase
    .from('ugc_projects')
    .insert({ brand_id: brandId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data as UgcProject;
}

export async function getUgcProject(projectId: string): Promise<UgcProject | null> {
  const { data } = await supabase
    .from('ugc_projects')
    .select('*')
    .eq('id', projectId)
    .single();
  return data as UgcProject | null;
}

export async function getUgcProjectsByBrand(brandId: string): Promise<UgcProject[]> {
  const { data } = await supabase
    .from('ugc_projects')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });
  return (data ?? []) as UgcProject[];
}

export async function getUgcProjectsByCreator(creatorId: string): Promise<UgcProject[]> {
  const { data } = await supabase
    .from('ugc_projects')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });
  return (data ?? []) as UgcProject[];
}

export async function updateUgcProjectStatus(
  projectId: string,
  status: UgcProjectStatus,
): Promise<void> {
  const { error } = await supabase
    .from('ugc_projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId);
  if (error) throw error;
}

export async function submitUgcDelivery(
  projectId: string,
  creatorId: string,
  contentUrls: string[],
  meta: { format?: string; duration_seconds?: number; notes?: string; revision_round?: number },
): Promise<void> {
  const { error: delErr } = await supabase
    .from('ugc_deliveries')
    .insert({ project_id: projectId, creator_id: creatorId, content_urls: contentUrls, ...meta });
  if (delErr) throw delErr;

  await updateUgcProjectStatus(projectId, 'brand_reviewing');
}

export async function getUgcDeliveries(projectId: string): Promise<UgcDelivery[]> {
  const { data } = await supabase
    .from('ugc_deliveries')
    .select('*')
    .eq('project_id', projectId)
    .order('submitted_at', { ascending: false });
  return (data ?? []) as UgcDelivery[];
}

// ─── Escrow & Invoices (client-side — solo lectura, sin service role) ─────────

export interface EscrowPayment {
  id: string;
  payer_user_id: string;
  payee_user_id: string;
  ugc_project_id: string | null;
  collab_id: string | null;
  gross_amount_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  status: 'held' | 'released' | 'disputed' | 'refunded_partial';
  stripe_payment_id: string | null;
  held_at: string;
  released_at: string | null;
  transfer_reference: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  escrow_id: string | null;
  type: 'charge' | 'payout';
  amount_cents: number;
  tax_rate: number;
  tax_amount_cents: number | null;
  total_cents: number | null;
  pdf_url: string | null;
  issued_at: string;
}

export async function getEscrowsByUser(userId: string): Promise<EscrowPayment[]> {
  const { data } = await supabase
    .from('escrow_payments')
    .select('*')
    .or(`payer_user_id.eq.${userId},payee_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  return (data ?? []) as EscrowPayment[];
}

export async function getInvoicesByUser(userId: string): Promise<Invoice[]> {
  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });
  return (data ?? []) as Invoice[];
}

// ─── Subscriptions & Plan Limits ──────────────────────────────────────────────

export type PlanTier = 'free' | 'starter' | 'pro';

export interface UserPlan {
  plan: PlanTier;
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  stripe_customer_id: string | null;
}

export interface PlanLimits {
  plan: PlanTier;
  role: 'brand' | 'influencer';
  max_active_collabs: number | null;
  max_candidates_visible_month: number | null;
  max_applications_month: number | null;
  max_unlocks_month: number | null;
  monthly_credits: number;
  has_advanced_search: boolean;
  has_ai_matching: boolean;
  has_roi_reports: boolean;
  featured_in_discover: boolean;
  priority_support: boolean;
}

export interface PlanCheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
  upgrade_to?: 'starter' | 'pro';
  mode?: 'unlimited' | 'credits';
}

/** Obtiene plan activo + estado de suscripción para un usuario. */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  const { data: user } = await supabase
    .from('marketplace_users')
    .select('plan, stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, trial_end, cancel_at_period_end, current_period_end')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    plan: (user?.plan ?? 'free') as PlanTier,
    status: (sub?.status ?? null) as UserPlan['status'],
    trial_end: sub?.trial_end ?? null,
    cancel_at_period_end: sub?.cancel_at_period_end ?? false,
    current_period_end: sub?.current_period_end ?? null,
    stripe_customer_id: user?.stripe_customer_id ?? null,
  };
}

/** Límites de un plan + rol concreto (lectura pública). */
export async function getPlanLimits(plan: PlanTier, role: 'brand' | 'influencer'): Promise<PlanLimits | null> {
  const { data } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('plan', plan)
    .eq('role', role)
    .maybeSingle();
  return data as PlanLimits | null;
}

/** Lista todos los plan_limits (para la tabla de /pricing). */
export async function listAllPlanLimits(): Promise<PlanLimits[]> {
  const { data } = await supabase.from('plan_limits').select('*');
  return (data ?? []) as PlanLimits[];
}

/**
 * Comprueba si un usuario puede ejecutar una acción dentro de los límites del plan.
 * Acciones: 'create_collab' | 'apply_to_collab' | 'unlock_profile' | 'view_candidate'
 */
export async function checkPlanLimit(
  userId: string,
  action: 'create_collab' | 'apply_to_collab' | 'unlock_profile' | 'view_candidate',
): Promise<PlanCheckResult> {
  const { data, error } = await supabase.rpc('check_plan_limit', {
    p_user_id: userId,
    p_action: action,
  });
  if (error) {
    console.error('checkPlanLimit error:', error);
    return { allowed: false, reason: error.message };
  }
  return data as PlanCheckResult;
}

/** Inicia checkout para suscripción. Devuelve URL a la que redirigir. */
export async function startSubscriptionCheckout(
  userId: string,
  plan: 'starter' | 'pro',
): Promise<string> {
  const res = await fetch('/api/stripe/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, plan }),
  });
  const body = await res.json();
  if (!res.ok || !body.url) throw new Error(body.error ?? 'Error creando checkout');
  return body.url as string;
}

/** Abre el Stripe Customer Portal. Devuelve URL. */
export async function openBillingPortal(userId: string): Promise<string> {
  const res = await fetch('/api/stripe/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  const body = await res.json();
  if (!res.ok || !body.url) throw new Error(body.error ?? 'Error abriendo portal');
  return body.url as string;
}

export async function getCreatorConnectStatus(userId: string): Promise<{
  stripe_connect_id: string | null;
  stripe_connect_onboarded: boolean;
}> {
  const { data } = await supabase
    .from('marketplace_users')
    .select('stripe_connect_id, stripe_connect_onboarded')
    .eq('id', userId)
    .single();
  return {
    stripe_connect_id: (data as { stripe_connect_id: string | null } | null)?.stripe_connect_id ?? null,
    stripe_connect_onboarded: (data as { stripe_connect_onboarded: boolean } | null)?.stripe_connect_onboarded ?? false,
  };
}

/** Analytics agregados de la marca: alcance total, colaboraciones, top influencers. */
export async function getBrandAnalytics(brandId: string) {
  const { data } = await supabase
    .from('collab_applications')
    .select(`
      id, influencer_profile_id, collab_status, created_at,
      creator:marketplace_users!influencer_profile_id ( display_name, niche ),
      delivery:collaboration_deliveries!application_id (
        reach, impressions, interactions, video_views,
        submitted_at
      )
    `)
    .eq('brand_id', brandId)
    .eq('status', 'accepted');
  return (data ?? []) as unknown as {
    id: string;
    influencer_profile_id: string;
    collab_status: string | null;
    created_at: string;
    creator: { display_name: string; niche: string | null } | null;
    delivery: {
      reach: number | null; impressions: number | null;
      interactions: number | null; video_views: number | null;
      submitted_at: string;
    } | null;
  }[];
}

// ─── Contact Requests ─────────────────────────────────────────────────────────

export interface ContactRequest {
  id: string;
  brand_user_id: string;
  creator_user_id: string;
  message: string | null;
  status: 'pending' | 'responded' | 'dismissed';
  created_at: string;
  other_name: string;
  other_logo: string | null;
}

/** Obtiene solicitudes de contacto para el creador autenticado (lado cliente). */
export async function getContactRequestsForCreator(creatorUserId: string): Promise<ContactRequest[]> {
  const { data } = await supabase
    .from('contact_requests')
    .select('*')
    .eq('creator_user_id', creatorUserId)
    .order('created_at', { ascending: false });
  return (data ?? []) as ContactRequest[];
}

/** Marca una solicitud de contacto como 'dismissed'. */
export async function dismissContactRequest(requestId: string): Promise<void> {
  await supabase
    .from('contact_requests')
    .update({ status: 'dismissed' })
    .eq('id', requestId);
}

// ─── Direct Chat ──────────────────────────────────────────────────────────────

export interface DirectConversation {
  id: string;
  brand_user_id: string;
  creator_user_id: string;
  last_message_at: string | null;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  direct_conversation_id: string;
  sender_user_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface DirectConversationEnriched extends DirectConversation {
  other_id: string;
  other_name: string;
  other_avatar: string | null;
  last_message_content: string | null;
  last_message_mine: boolean | null;
  unread_count: number;
}

/** Crea o devuelve la conversación directa entre una marca y un creador. */
export async function getOrCreateDirectConversation(
  brandUserId: string,
  creatorUserId: string,
): Promise<DirectConversation> {
  const { data: existing } = await supabase
    .from('direct_conversations')
    .select('*')
    .eq('brand_user_id', brandUserId)
    .eq('creator_user_id', creatorUserId)
    .maybeSingle();

  if (existing) return existing as DirectConversation;

  const { data, error } = await supabase
    .from('direct_conversations')
    .insert({ brand_user_id: brandUserId, creator_user_id: creatorUserId })
    .select()
    .single();

  if (error) throw error;
  return data as DirectConversation;
}

/** Devuelve una conversación directa por ID, incluyendo info de ambos participantes. */
export async function getDirectConversationById(id: string): Promise<
  (DirectConversation & { brand_name: string; creator_name: string; brand_avatar: string | null; creator_avatar: string | null }) | null
> {
  const { data: conv } = await supabase
    .from('direct_conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!conv) return null;

  const { data: users } = await supabase
    .from('marketplace_users')
    .select('id, display_name')
    .in('id', [conv.brand_user_id, conv.creator_user_id]);

  const byId = new Map((users ?? []).map(u => [u.id, u]));

  const { data: brandProfile } = await supabase
    .from('brand_profiles')
    .select('logo_url')
    .eq('user_id', conv.brand_user_id)
    .maybeSingle();

  const { data: creatorProfile } = await supabase
    .from('influencer_profiles')
    .select('avatar_url')
    .eq('user_id', conv.creator_user_id)
    .maybeSingle();

  return {
    ...(conv as DirectConversation),
    brand_name: byId.get(conv.brand_user_id)?.display_name ?? 'Marca',
    creator_name: byId.get(conv.creator_user_id)?.display_name ?? 'Creador',
    brand_avatar: brandProfile?.logo_url ?? null,
    creator_avatar: creatorProfile?.avatar_url ?? null,
  };
}

/** Historial de mensajes de una conversación directa. */
export async function getDirectMessages(conversationId: string): Promise<DirectMessage[]> {
  const { data } = await supabase
    .from('direct_messages')
    .select('*')
    .eq('direct_conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return (data ?? []) as DirectMessage[];
}

/** Envía un mensaje directo y actualiza last_message_at. */
export async function sendDirectMessage(
  conversationId: string,
  senderUserId: string,
  content: string,
): Promise<DirectMessage> {
  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ direct_conversation_id: conversationId, sender_user_id: senderUserId, content })
    .select()
    .single();
  if (error) throw error;

  const msg = data as DirectMessage;
  await supabase
    .from('direct_conversations')
    .update({ last_message_at: msg.created_at })
    .eq('id', conversationId);

  return msg;
}

/** Marca como leídos los mensajes recibidos en una conversación (los del otro). */
export async function markDirectMessagesRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from('direct_messages')
    .update({ is_read: true })
    .eq('direct_conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_user_id', userId);
}

/** Lista todas las conversaciones directas de un usuario, enriquecidas con el nombre del otro. */
export async function getDirectConversationsForUser(
  userId: string,
): Promise<DirectConversationEnriched[]> {
  const { data: convs } = await supabase
    .from('direct_conversations')
    .select('*')
    .or(`brand_user_id.eq.${userId},creator_user_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (!convs?.length) return [];

  const brandOtherIds = convs.filter(c => c.creator_user_id === userId).map(c => c.brand_user_id);
  const creatorOtherIds = convs.filter(c => c.brand_user_id === userId).map(c => c.creator_user_id);
  const allOtherIds = [...new Set([...brandOtherIds, ...creatorOtherIds])];

  const { data: users } = await supabase
    .from('marketplace_users')
    .select('id, display_name')
    .in('id', allOtherIds);

  const convIds = convs.map(c => c.id);
  const [{ data: brandAvatars }, { data: creatorAvatars }, { data: allMsgs }] = await Promise.all([
    brandOtherIds.length
      ? supabase.from('brand_profiles').select('user_id, logo_url').in('user_id', brandOtherIds)
      : Promise.resolve({ data: [] }),
    creatorOtherIds.length
      ? supabase.from('influencer_profiles').select('user_id, avatar_url').in('user_id', creatorOtherIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('direct_messages')
      .select('direct_conversation_id, content, sender_user_id, created_at, is_read')
      .in('direct_conversation_id', convIds)
      .order('created_at', { ascending: false }),
  ]);

  const lastMsgMap = new Map<string, { content: string; sender_user_id: string }>();
  const unreadMap = new Map<string, number>();
  for (const m of allMsgs ?? []) {
    if (!lastMsgMap.has(m.direct_conversation_id)) {
      lastMsgMap.set(m.direct_conversation_id, m);
    }
    if (!m.is_read && m.sender_user_id !== userId) {
      unreadMap.set(m.direct_conversation_id, (unreadMap.get(m.direct_conversation_id) ?? 0) + 1);
    }
  }

  const usersMap = new Map((users ?? []).map(u => [u.id, u]));
  const brandAvatarMap = new Map((brandAvatars ?? []).map(b => [b.user_id, b.logo_url]));
  const creatorAvatarMap = new Map((creatorAvatars ?? []).map(c => [c.user_id, c.avatar_url]));

  return convs.map(c => {
    const isBrand = c.brand_user_id === userId;
    const otherId = isBrand ? c.creator_user_id : c.brand_user_id;
    const other = usersMap.get(otherId);
    const lastMsg = lastMsgMap.get(c.id);
    const otherAvatar = isBrand
      ? (creatorAvatarMap.get(otherId) ?? null)
      : (brandAvatarMap.get(otherId) ?? null);
    return {
      ...(c as DirectConversation),
      other_id: otherId,
      other_name: other?.display_name ?? 'Usuario',
      other_avatar: otherAvatar,
      last_message_content: lastMsg?.content ?? null,
      last_message_mine: lastMsg ? lastMsg.sender_user_id === userId : null,
      unread_count: unreadMap.get(c.id) ?? 0,
    };
  });
}
