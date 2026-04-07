'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase, unlockProfile as sbUnlockProfile, getUnlockedProfileIds } from '@/lib/supabase';

export function useCredits(userId: string | null) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [persistedUnlocked, setPersistedUnlocked] = useState<Set<string>>(new Set());

  // Cargar créditos + perfiles ya desbloqueados al iniciar
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('marketplace_users')
      .select('credits')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) setCredits(data.credits);
      });
    getUnlockedProfileIds(userId).then(ids => {
      setPersistedUnlocked(new Set(ids));
    });
  }, [userId]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`credits:${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'marketplace_users',
        filter: `id=eq.${userId}`,
      }, payload => {
        setCredits((payload.new as { credits: number }).credits);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const unlock = useCallback(async (influencerProfileId: string) => {
    if (!userId) return { success: false, error_code: 'no_user' };
    setLoading(true);
    try {
      const result = await sbUnlockProfile(userId, influencerProfileId);
      if (result?.credits_remaining !== undefined) {
        setCredits(result.credits_remaining);
      }
      if (result?.success) {
        setPersistedUnlocked(prev => new Set([...prev, influencerProfileId]));
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { credits, loading, unlock, persistedUnlocked };
}
