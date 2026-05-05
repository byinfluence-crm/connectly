import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: mu } = await supabaseAdmin
    .from('marketplace_users')
    .select('user_type')
    .eq('id', user.id)
    .single();
  if (mu?.user_type !== 'superadmin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('influencer_profiles')
    .select(`
      id, user_id, display_name, avatar_url, city, niches, creator_type,
      instagram_handle, tiktok_handle,
      followers_ig, followers_tt,
      avg_views_ig, avg_views_tt,
      engagement_rate_ig, engagement_rate_tt,
      price_min, price_max,
      is_verified, is_claimed, last_sync_at, created_at
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ creators: data ?? [] });
}
