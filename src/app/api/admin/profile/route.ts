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
    .select('user_type, display_name')
    .eq('id', user.id)
    .single();
  if (mu?.user_type !== 'superadmin') {
    return { ok: false as const, res: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  }
  return { ok: true as const, userId: user.id, displayName: mu.display_name as string };
}

export async function GET(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if (!auth.ok) return auth.res;

  const { data: agency } = await supabaseAdmin
    .from('agencies')
    .select('id, name')
    .eq('owner_id', auth.userId)
    .maybeSingle();

  return NextResponse.json({
    display_name: auth.displayName,
    agency_name: agency?.name ?? auth.displayName,
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if (!auth.ok) return auth.res;

  const { display_name, agency_name } = await req.json() as {
    display_name?: string;
    agency_name?: string;
  };

  const name = display_name?.trim();
  if (!name) return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 });

  // Actualizar marketplace_users
  await supabaseAdmin
    .from('marketplace_users')
    .update({ display_name: name })
    .eq('id', auth.userId);

  // Actualizar auth metadata
  await supabaseAdmin.auth.admin.updateUserById(auth.userId, {
    user_metadata: { display_name: name },
  });

  // Actualizar nombre de la agencia
  const agencyName = (agency_name?.trim() || name);
  await supabaseAdmin
    .from('agencies')
    .update({ name: agencyName })
    .eq('owner_id', auth.userId);

  return NextResponse.json({ success: true });
}
