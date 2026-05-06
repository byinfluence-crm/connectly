import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeInfluencerMetrics, type ScraperInfluencerData } from '@/lib/metrics';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const API_KEY = process.env.SCRAPER_API_KEY!;

/**
 * POST /api/influencer/sync
 *
 * Called by the external scraper to upsert influencer metrics.
 * Lookup priority: instagram_handle → phone (in marketplace_users) → no match → 404.
 * If the influencer_profile doesn't exist yet (pre-registration), the row is created
 * with a null user_id so it can be claimed when the user registers.
 *
 * Auth: Authorization: Bearer <SCRAPER_API_KEY>
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  if (!API_KEY || auth !== `Bearer ${API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ScraperInfluencerData;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.instagram_handle && !body.phone) {
    return NextResponse.json(
      { error: 'Provide at least instagram_handle or phone' },
      { status: 400 },
    );
  }

  // 1. Find existing influencer_profile row
  let profileId: string | null = null;

  if (body.instagram_handle) {
    const { data } = await supabaseAdmin
      .from('influencer_profiles')
      .select('id')
      .eq('instagram_handle', body.instagram_handle)
      .maybeSingle();
    if (data) profileId = data.id;
  }

  if (!profileId && body.phone) {
    // Look up user in marketplace_users by phone, then find their profile
    const { data: mu } = await supabaseAdmin
      .from('marketplace_users')
      .select('id')
      .eq('phone', body.phone)
      .eq('user_type', 'influencer')
      .maybeSingle();

    if (mu) {
      const { data: ip } = await supabaseAdmin
        .from('influencer_profiles')
        .select('id')
        .eq('user_id', mu.id)
        .maybeSingle();
      if (ip) profileId = ip.id;
    }
  }

  // 2. Compute derived metrics
  const metrics = computeInfluencerMetrics(body);

  // 3. Upsert the profile
  if (profileId) {
    const { error } = await supabaseAdmin
      .from('influencer_profiles')
      .update(metrics)
      .eq('id', profileId);

    if (error) {
      console.error('[sync] update error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // No existing profile — create a pre-registration row (user_id = null)
    const { data: created, error } = await supabaseAdmin
      .from('influencer_profiles')
      .insert({
        ...metrics,
        user_id: null,
        display_name: body.display_name ?? body.instagram_handle ?? body.phone ?? 'Pendiente',
        instagram_handle: body.instagram_handle ?? null,
        tiktok_handle: body.tiktok_handle ?? null,
        niches: [],
        followers_ig: body.followers_ig ?? 0,
        followers_tt: body.followers_tt ?? 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[sync] insert error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    profileId = created.id;
  }

  // 4. Sync phone to marketplace_users if we can resolve the user
  if (body.phone && body.instagram_handle) {
    const { data: ip } = await supabaseAdmin
      .from('influencer_profiles')
      .select('user_id')
      .eq('id', profileId)
      .maybeSingle();

    if (ip?.user_id) {
      await supabaseAdmin
        .from('marketplace_users')
        .update({ phone: body.phone })
        .eq('id', ip.user_id);
    }
  }

  return NextResponse.json({ ok: true, profile_id: profileId });
}
