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
  return { ok: true as const, userId: user.id };
}

/** GET /api/admin/brands — lista marcas de la agencia del superadmin */
export async function GET(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if (!auth.ok) return auth.res;

  const { data: agency } = await supabaseAdmin
    .from('agencies')
    .select('id')
    .eq('owner_id', auth.userId)
    .maybeSingle();

  if (!agency) {
    return NextResponse.json({ brands: [] });
  }

  const { data: links } = await supabaseAdmin
    .from('agency_brands')
    .select('brand_user_id, created_at')
    .eq('agency_id', agency.id)
    .order('created_at', { ascending: false });

  if (!links?.length) return NextResponse.json({ brands: [] });

  const brandIds = links.map(l => l.brand_user_id);

  const { data: profiles } = await supabaseAdmin
    .from('brand_profiles')
    .select('id, user_id, brand_name, logo_url, sector, city, description, website, is_verified')
    .in('user_id', brandIds);

  const { data: users } = await supabaseAdmin
    .from('marketplace_users')
    .select('id, display_name')
    .in('id', brandIds);

  const brands = (profiles ?? []).map(p => ({
    ...p,
    display_name: users?.find(u => u.id === p.user_id)?.display_name ?? p.brand_name,
    linked_at: links.find(l => l.brand_user_id === p.user_id)?.created_at,
  }));

  return NextResponse.json({ brands });
}

/** POST /api/admin/brands — crea una marca y la vincula a la agencia */
export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if (!auth.ok) return auth.res;

  const { brand_name, email, sector, city, description, website } =
    await req.json() as {
      brand_name: string;
      email: string;
      sector?: string;
      city?: string;
      description?: string;
      website?: string;
    };

  if (!brand_name || !email) {
    return NextResponse.json({ error: 'brand_name y email son obligatorios' }, { status: 400 });
  }

  // Obtener la agencia del superadmin
  const { data: agency } = await supabaseAdmin
    .from('agencies')
    .select('id')
    .eq('owner_id', auth.userId)
    .maybeSingle();

  if (!agency) {
    return NextResponse.json({ error: 'No tienes una agencia creada. Ejecuta el SQL de activación.' }, { status: 400 });
  }

  // Generar contraseña temporal
  const tempPassword = `Brand${Math.floor(100000 + Math.random() * 900000)}!`;

  // Crear usuario en Supabase Auth
  const { data: newUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { display_name: brand_name, user_type: 'brand' },
  });

  if (authErr || !newUser.user) {
    const msg = authErr?.message ?? 'Error al crear usuario';
    if (msg.includes('already been registered')) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const brandUserId = newUser.user.id;

  // Crear marketplace_users
  await supabaseAdmin.from('marketplace_users').upsert({
    id: brandUserId,
    user_type: 'brand',
    display_name: brand_name,
    city: city ?? null,
    credits: 0,
  }, { onConflict: 'id' });

  // Crear brand_profiles
  await supabaseAdmin.from('brand_profiles').upsert({
    user_id: brandUserId,
    brand_name,
    sector: sector ?? null,
    city: city ?? null,
    description: description ?? null,
    website: website ?? null,
  }, { onConflict: 'user_id' });

  // Vincular marca a la agencia
  await supabaseAdmin.from('agency_brands').insert({
    agency_id: agency.id,
    brand_user_id: brandUserId,
  });

  return NextResponse.json({
    success: true,
    brand_user_id: brandUserId,
    temp_password: tempPassword,
    message: `Marca creada. Contraseña temporal: ${tempPassword}`,
  });
}
