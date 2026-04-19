'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase, getUserPlan, getPlanLimits } from '@/lib/supabase';
import type { UserPlan, PlanLimits } from '@/lib/supabase';

/**
 * Hook que expone:
 * - plan info (free/starter/pro + estado, trial_end, cancel_at_period_end)
 * - límites del plan actual según rol (marca o creador)
 * - refresh manual tras upgrade
 * - subscripción Realtime al cambio de subscriptions para auto-refresh
 */
export function useSubscription(userId: string | null, role: 'brand' | 'influencer' | null) {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId || !role) {
      setLoading(false);
      return;
    }
    try {
      const plan = await getUserPlan(userId);
      setUserPlan(plan);
      const lim = await getPlanLimits(plan.plan, role);
      setLimits(lim);
    } catch (err) {
      console.error('useSubscription refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: escuchar cambios en subscriptions para este user
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`sub:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        () => { refresh(); },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_users',
          filter: `id=eq.${userId}`,
        },
        () => { refresh(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, refresh]);

  return {
    plan: userPlan?.plan ?? 'free',
    status: userPlan?.status ?? null,
    trial_end: userPlan?.trial_end ?? null,
    cancel_at_period_end: userPlan?.cancel_at_period_end ?? false,
    current_period_end: userPlan?.current_period_end ?? null,
    stripe_customer_id: userPlan?.stripe_customer_id ?? null,
    limits,
    loading,
    refresh,
  };
}
