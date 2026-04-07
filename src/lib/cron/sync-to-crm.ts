/**
 * sync-to-crm.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sincronización batch diaria Connectly → Byinfluence CRM.
 *
 * Calcula métricas agregadas de cada influencer activo en Connectly y
 * las escribe en la tabla `influencers` del CRM de Byinfluence (Supabase
 * proyecto: lehmintlhsjcsoefhdyo), usando el campo `crm_influencer_id`
 * como puente entre proyectos.
 *
 * CÓMO EJECUTAR:
 *   - Vercel Cron (recomendado): añadir a vercel.json:
 *       "crons": [{ "path": "/api/cron/sync-crm", "schedule": "0 3 * * *" }]
 *   - Manual (desarrollo):
 *       npx ts-node src/lib/cron/sync-to-crm.ts
 *
 * VARIABLES DE ENTORNO necesarias:
 *   NEXT_PUBLIC_SUPABASE_URL         — Connectly project
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY    — Connectly anon key
 *   CRM_SUPABASE_URL                 — Byinfluence CRM project
 *   CRM_SUPABASE_SERVICE_KEY         — CRM service role key (write access)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';

// ─── Clientes Supabase ────────────────────────────────────────────────────────

const connectly = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const crm = createClient(
  process.env.CRM_SUPABASE_URL!,
  process.env.CRM_SUPABASE_SERVICE_KEY!,
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface InfluencerSyncPayload {
  crm_influencer_id: string;    // FK de texto entre proyectos
  connectly_score: number;
  connectly_collabs_total: number;
  connectly_reach_total: number;
  connectly_avg_er: number;
  connectly_avg_rating: number;
  connectly_would_repeat_pct: number;
  connectly_last_synced_at: string;
}

// ─── Score calculator ─────────────────────────────────────────────────────────

function calculateScore({
  avgER,
  avgRating,
  completionRate,
  wouldRepeatPct,
}: {
  avgER: number;
  avgRating: number;
  completionRate: number;
  wouldRepeatPct: number;
}): number {
  // Pesos: engagement 35%, rating 30%, completion 20%, would_repeat 15%
  const engagementScore = Math.min(avgER * 10, 100) * 0.35;
  const ratingScore = (avgRating / 5) * 100 * 0.30;
  const completionScore = completionRate * 100 * 0.20;
  const repeatScore = wouldRepeatPct * 0.15;
  return Math.round(engagementScore + ratingScore + completionScore + repeatScore);
}

// ─── Main sync ────────────────────────────────────────────────────────────────

export async function syncInfluencersToCRM(): Promise<{
  synced: number;
  errors: { id: string; error: string }[];
  duration_ms: number;
}> {
  const startedAt = Date.now();
  const errors: { id: string; error: string }[] = [];
  let synced = 0;

  // 1. Obtener todos los influencers de Connectly con crm_influencer_id
  const { data: users, error: usersErr } = await connectly
    .from('marketplace_users')
    .select('id, crm_influencer_id')
    .eq('user_type', 'influencer')
    .not('crm_influencer_id', 'is', null);

  if (usersErr || !users) {
    throw new Error(`Error fetching influencers: ${usersErr?.message}`);
  }

  for (const u of users) {
    try {
      // 2. Estadísticas de entregas
      const { data: deliveries } = await connectly
        .from('collaboration_deliveries')
        .select('reach, impressions, interactions, submitted_at')
        .eq('influencer_id', u.id);

      const totalReach = deliveries?.reduce((s, d) => s + (d.reach ?? 0), 0) ?? 0;
      const totalInteractions = deliveries?.reduce((s, d) => s + (d.interactions ?? 0), 0) ?? 0;
      const avgER = totalReach > 0 ? (totalInteractions / totalReach) * 100 : 0;

      // 3. Colaboraciones totales y completadas
      const { count: totalApps } = await connectly
        .from('collab_applications')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', u.id)
        .eq('status', 'accepted');

      const { count: completedApps } = await connectly
        .from('collab_applications')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', u.id)
        .eq('collab_status', 'completed');

      const completionRate = totalApps && totalApps > 0
        ? (completedApps ?? 0) / totalApps
        : 0;

      // 4. Reviews
      const { data: reviews } = await connectly
        .from('reviews')
        .select('rating, would_repeat')
        .eq('reviewed_id', u.id)
        .eq('reviewer_role', 'brand');

      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length
        : 0;
      const wouldRepeatPct = reviews && reviews.length > 0
        ? (reviews.filter(r => r.would_repeat).length / reviews.length) * 100
        : 0;

      // 5. Calcular score
      const score = calculateScore({ avgER, avgRating, completionRate, wouldRepeatPct });

      // 6. Escribir score en Connectly (tabla influencer_scores)
      await connectly.from('influencer_scores').insert({
        influencer_id: u.id,
        score,
        engagement_factor: parseFloat(avgER.toFixed(2)),
        rating_factor: parseFloat(avgRating.toFixed(2)),
        punctuality_factor: parseFloat((completionRate * 100).toFixed(2)),
        completion_factor: parseFloat(completionRate.toFixed(2)) * 100,
      });

      // 7. Actualizar CRM de Byinfluence
      const payload: InfluencerSyncPayload = {
        crm_influencer_id: u.crm_influencer_id,
        connectly_score: score,
        connectly_collabs_total: completedApps ?? 0,
        connectly_reach_total: totalReach,
        connectly_avg_er: parseFloat(avgER.toFixed(2)),
        connectly_avg_rating: parseFloat(avgRating.toFixed(2)),
        connectly_would_repeat_pct: parseFloat(wouldRepeatPct.toFixed(1)),
        connectly_last_synced_at: new Date().toISOString(),
      };

      const { error: crmErr } = await crm
        .from('influencers')
        .update(payload)
        .eq('id', u.crm_influencer_id);

      if (crmErr) throw new Error(crmErr.message);

      synced++;
    } catch (e) {
      errors.push({ id: u.id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const duration_ms = Date.now() - startedAt;

  // 8. Log de sincronización en Connectly
  await connectly.from('crm_sync_log').insert({
    profiles_synced: synced,
    errors: errors.length > 0 ? errors : null,
    duration_ms,
  });

  return { synced, errors, duration_ms };
}

// ─── Handler de Vercel Cron / ejecución manual ────────────────────────────────

if (require.main === module) {
  syncInfluencersToCRM()
    .then(result => {
      console.log(`✅ Sync completado: ${result.synced} perfiles en ${result.duration_ms}ms`);
      if (result.errors.length > 0) {
        console.error(`⚠️ ${result.errors.length} errores:`, result.errors);
      }
    })
    .catch(err => {
      console.error('❌ Sync fallido:', err);
      process.exit(1);
    });
}
