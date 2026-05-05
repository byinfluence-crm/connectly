import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { creator_user_id, message } = body as { creator_user_id?: string; message?: string };

  if (!creator_user_id) {
    return NextResponse.json({ error: 'creator_user_id requerido' }, { status: 400 });
  }

  // Check user is a brand
  const { data: mu } = await supabaseAdmin
    .from('marketplace_users')
    .select('user_type, display_name')
    .eq('id', user.id)
    .single();

  if (!mu || mu.user_type !== 'brand') {
    return NextResponse.json({ error: 'Solo las marcas pueden enviar solicitudes' }, { status: 403 });
  }

  // Idempotency: skip if same brand already contacted this creator in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabaseAdmin
    .from('contact_requests')
    .select('id')
    .eq('brand_user_id', user.id)
    .eq('creator_user_id', creator_user_id)
    .gte('created_at', sevenDaysAgo)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, already_contacted: true });
  }

  const { error } = await supabaseAdmin
    .from('contact_requests')
    .insert({
      brand_user_id: user.id,
      creator_user_id,
      message: message?.trim() || null,
    });

  if (error) {
    console.error('[contact] insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // Return contact requests for the current user (creator sees inbound, brand sees outbound)
  const { data: mu } = await supabaseAdmin
    .from('marketplace_users')
    .select('user_type')
    .eq('id', user.id)
    .single();

  const isCreator = mu?.user_type === 'influencer';
  const column = isCreator ? 'creator_user_id' : 'brand_user_id';
  const joinColumn = isCreator ? 'brand_user_id' : 'creator_user_id';

  const { data: requests } = await supabaseAdmin
    .from('contact_requests')
    .select('*')
    .eq(column, user.id)
    .order('created_at', { ascending: false });

  if (!requests?.length) return NextResponse.json({ requests: [] });

  // Fetch the other party's info
  const otherIds = [...new Set(requests.map(r => r[joinColumn]))];
  const { data: others } = await supabaseAdmin
    .from('marketplace_users')
    .select('id, display_name')
    .in('id', otherIds);

  // Also fetch brand_profiles for logo if creator is viewing
  let brandLogos: Record<string, string | null> = {};
  if (isCreator) {
    const { data: bps } = await supabaseAdmin
      .from('brand_profiles')
      .select('user_id, logo_url')
      .in('user_id', otherIds);
    for (const bp of bps ?? []) {
      brandLogos[bp.user_id] = bp.logo_url;
    }
  }

  const othersMap = new Map((others ?? []).map(o => [o.id, o]));

  const enriched = requests.map(r => {
    const otherId = r[joinColumn];
    const other = othersMap.get(otherId);
    return {
      ...r,
      other_name: other?.display_name ?? 'Usuario',
      other_logo: brandLogos[otherId] ?? null,
    };
  });

  return NextResponse.json({ requests: enriched });
}
