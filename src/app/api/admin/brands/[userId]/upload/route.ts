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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireSuperadmin(req);
  if (!auth.ok) return auth.res;

  const { userId } = await params;
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const folder = (formData.get('folder') as string | null) ?? 'misc';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${folder}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from('brand-assets')
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage.from('brand-assets').getPublicUrl(path);
  return NextResponse.json({ url: publicUrl });
}
