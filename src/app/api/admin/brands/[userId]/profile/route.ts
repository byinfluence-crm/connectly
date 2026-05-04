import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function requireSuperadmin(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  const { data: mu } = await supabaseAdmin
    .from('marketplace_users')
    .select('user_type')
    .eq('id', user.id)
    .single();
  if (mu?.user_type !== 'superadmin') {
    return { ok: false as const, res: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  }
  return { ok: true as const };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireSuperadmin(req);
  if (!auth.ok) return auth.res;

  const { userId } = await params;

  const { data, error } = await supabaseAdmin
    .from('brand_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireSuperadmin(req);
  if (!auth.ok) return auth.res;

  const { userId } = await params;
  const body = await req.json();

  // Strip immutable fields before update
  const { id: _id, user_id: _uid, rating_avg: _ra, total_reviews: _tr, is_verified: _iv, is_claimed: _ic, ...updateData } = body;

  const { error } = await supabaseAdmin
    .from('brand_profiles')
    .update(updateData)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
