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
}

/** Perfil público de cualquier usuario (datos básicos de marketplace_users). */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from('marketplace_users')
    .select('id, user_type, display_name, city, niche, is_verified, is_boosted, created_at')
    .eq('id', userId)
    .single();
  return data as PublicProfile | null;
}

/** Colaboraciones activas de una marca (para su perfil público). */
export async function getBrandActiveCollabs(brandId: string) {
  const { data } = await supabase
    .from('collabs')
    .select('id, title, type, budget, niche, city, deadline, is_boosted')
    .eq('brand_id', brandId)
    .eq('status', 'active')
    .order('is_boosted', { ascending: false });
  return (data ?? []) as {
    id: string; title: string; type: string; budget: number | null;
    niche: string; city: string; deadline: string; is_boosted: boolean;
  }[];
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
  collab_status?: string | null;
  collab: {
    id: string;
    title: string;
    type: string;
    budget: number | null;
    brand: { display_name: string } | null;
  } | null;
}

export interface ApplicationWithCreator extends CollabApplication {
  collab_status?: string | null;
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
      id, collab_id, creator_id, brand_id, status, collab_status, message, created_at,
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
      id, collab_id, creator_id, brand_id, status, collab_status, message, created_at,
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

/** Datos de una aplicación concreta (para el chat). */
export async function getApplicationById(appId: string): Promise<{
  id: string;
  status: string;
  creator_id: string;
  brand_id: string;
  creator: { display_name: string } | null;
  brand: { display_name: string } | null;
  collab: { title: string } | null;
} | null> {
  const { data } = await supabase
    .from('collab_applications')
    .select(`
      id, status, creator_id, brand_id,
      creator:marketplace_users!creator_id ( display_name ),
      brand:marketplace_users!brand_id ( display_name ),
      collab:collabs!collab_id ( title )
    `)
    .eq('id', appId)
    .single();
  return data as typeof data & null;
}

// ─── Chat / Messages ──────────────────────────────────────────────────────────

export interface Message {
  id: string;
  application_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

/** Historial de mensajes de una aplicación. */
export async function getMessages(applicationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, application_id, sender_id, content, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

/** Envía un mensaje. Lanza error si el contenido contiene un teléfono. */
export async function sendMessage(
  applicationId: string,
  senderId: string,
  content: string,
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ application_id: applicationId, sender_id: senderId, content })
    .select()
    .single();
  if (error) throw error;
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
        collab:collabs!collab_id ( title, type ),
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
      collab: { title: string; type: string } | null;
      brand: { display_name: string } | null;
    } | null;
  }[];
}

/** Analytics agregados de la marca: alcance total, colaboraciones, top influencers. */
export async function getBrandAnalytics(brandId: string) {
  const { data } = await supabase
    .from('collab_applications')
    .select(`
      id, creator_id, collab_status, created_at,
      creator:marketplace_users!creator_id ( display_name, niche ),
      delivery:collaboration_deliveries!application_id (
        reach, impressions, interactions, video_views,
        submitted_at
      )
    `)
    .eq('brand_id', brandId)
    .eq('status', 'accepted');
  return (data ?? []) as unknown as {
    id: string;
    creator_id: string;
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
