import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function requireCreator(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  const { data: mu } = await supabaseAdmin
    .from('marketplace_users')
    .select('user_type')
    .eq('id', user.id)
    .single();
  if (mu?.user_type !== 'influencer') {
    return { ok: false as const, res: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  }
  return { ok: true as const, userId: user.id };
}

export async function GET(req: NextRequest) {
  const auth = await requireCreator(req);
  if (!auth.ok) return auth.res;

  const { data: profile } = await supabaseAdmin
    .from('influencer_profiles')
    .select('display_name, bio, avatar_url, city, instagram_handle, tiktok_handle, followers_ig, followers_tt, niches, price_min, price_max, creator_type, fiscal_name, fiscal_nif, fiscal_address, billing_email')
    .eq('user_id', auth.userId)
    .maybeSingle();

  return NextResponse.json({ profile: profile ?? null });
}

const ALLOWED_FIELDS = [
  'display_name', 'bio', 'avatar_url', 'city',
  'instagram_handle', 'tiktok_handle', 'followers_ig', 'followers_tt',
  'niches', 'price_min', 'price_max', 'creator_type',
  'fiscal_name', 'fiscal_nif', 'fiscal_address', 'billing_email',
];

export async function PUT(req: NextRequest) {
  const auth = await requireCreator(req);
  if (!auth.ok) return auth.res;

  const body = await req.json();
  const profileFields: Record<string, unknown> = { user_id: auth.userId };
  for (const key of ALLOWED_FIELDS) {
    if (key in body) profileFields[key] = body[key];
  }

  const { error: profileErr } = await supabaseAdmin
    .from('influencer_profiles')
    .upsert(profileFields, { onConflict: 'user_id' });

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  if (body.display_name) {
    await supabaseAdmin
      .from('marketplace_users')
      .update({ display_name: body.display_name })
      .eq('id', auth.userId);
  }

  return NextResponse.json({ success: true });
}
