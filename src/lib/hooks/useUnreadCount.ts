'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useUnreadCount(userId: string | undefined): number {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!userId) { setCount(0); return; }

    // Unread en chats directos
    const { data: directConvs } = await supabase
      .from('direct_conversations')
      .select('id')
      .or(`brand_user_id.eq.${userId},creator_user_id.eq.${userId}`);

    const directIds = (directConvs ?? []).map(c => c.id);

    const directPromise = directIds.length
      ? supabase
          .from('direct_messages')
          .select('*', { count: 'exact', head: true })
          .in('direct_conversation_id', directIds)
          .eq('is_read', false)
          .neq('sender_user_id', userId)
      : Promise.resolve({ count: 0 });

    // Unread en chats de colaboración (vía influencer_profile o brand_profile del usuario)
    const { data: brandProfile } = await supabase
      .from('brand_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: influencerProfile } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const collabConvFilter = [];
    if (brandProfile?.id) collabConvFilter.push(`brand_profile_id.eq.${brandProfile.id}`);
    if (influencerProfile?.id) collabConvFilter.push(`influencer_profile_id.eq.${influencerProfile.id}`);

    const collabPromise = collabConvFilter.length
      ? supabase
          .from('conversations')
          .select('id')
          .or(collabConvFilter.join(','))
          .then(async ({ data: collabConvs }) => {
            const collabIds = (collabConvs ?? []).map(c => c.id);
            if (!collabIds.length) return { count: 0 };
            return supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .in('conversation_id', collabIds)
              .eq('is_read', false)
              .neq('sender_user_id', userId);
          })
      : Promise.resolve({ count: 0 });

    const [directResult, collabResult] = await Promise.all([directPromise, collabPromise]);
    setCount((directResult.count ?? 0) + (collabResult.count ?? 0));
  }, [userId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Realtime: re-fetch al insertar o actualizar mensajes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`unread:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, fetchCount)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, fetchCount)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchCount)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchCount]);

  return count;
}
