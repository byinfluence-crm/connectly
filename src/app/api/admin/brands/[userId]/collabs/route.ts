import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function requireSuperadmin(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return { ok: false as const, res: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  const { data: mu } = await supabaseAdmin.from('marketplace_users').select('user_type').eq('id', user.id).single();
  if (mu?.user_type !== 'superadmin') return { ok: false as const, res: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  return { ok: true as const };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireSuperadmin(req);
  if (!auth.ok) return auth.res;

  const { userId } = await params;

  // Get brand profile id
  const { data: bp } = await supabaseAdmin
    .from('brand_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!bp) return NextResponse.json({ applications: [], stats: { total: 0, pending: 0, accepted: 0, completed: 0, rejected: 0 } });

  // All applications for this brand
  const { data: apps } = await supabaseAdmin
    .from('collab_applications')
    .select('id, status, collab_status, message, created_at, updated_at, collaboration_id, influencer_profile_id')
    .eq('brand_id', userId)
    .order('updated_at', { ascending: false });

  if (!apps?.length) return NextResponse.json({ applications: [], stats: { total: 0, pending: 0, accepted: 0, completed: 0, rejected: 0 } });

  const collabIds   = [...new Set(apps.map(a => a.collaboration_id))];
  const profileIds  = [...new Set(apps.map(a => a.influencer_profile_id))];

  const [collabsRes, profilesRes, convsRes] = await Promise.all([
    supabaseAdmin.from('collaborations').select('id, title, collab_type, budget_min, budget_max').in('id', collabIds),
    supabaseAdmin.from('influencer_profiles').select('id, display_name, avatar_url, city, niches, followers_ig, followers_tt, engagement_rate_ig, engagement_rate_tt').in('id', profileIds),
    supabaseAdmin.from('conversations').select('id, collaboration_id, influencer_profile_id, last_message_at').eq('brand_profile_id', bp.id),
  ]);

  const collabMap   = new Map((collabsRes.data ?? []).map(c => [c.id, c]));
  const profileMap  = new Map((profilesRes.data ?? []).map(p => [p.id, p]));

  // Last messages for each conversation
  const convIds = (convsRes.data ?? []).map(c => c.id);
  let lastMsgMap = new Map<string, string>();
  if (convIds.length) {
    const { data: msgs } = await supabaseAdmin
      .from('messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });
    const seen = new Set<string>();
    for (const m of msgs ?? []) {
      if (!seen.has(m.conversation_id)) {
        lastMsgMap.set(m.conversation_id, m.content);
        seen.add(m.conversation_id);
      }
    }
  }

  const convByKey = new Map<string, { id: string; last_message_at: string | null; last_message: string | null }>();
  for (const conv of convsRes.data ?? []) {
    convByKey.set(`${conv.collaboration_id}:${conv.influencer_profile_id}`, {
      id: conv.id,
      last_message_at: conv.last_message_at,
      last_message: lastMsgMap.get(conv.id) ?? null,
    });
  }

  const applications = apps.map(app => {
    const collab  = collabMap.get(app.collaboration_id);
    const profile = profileMap.get(app.influencer_profile_id);
    const conv    = convByKey.get(`${app.collaboration_id}:${app.influencer_profile_id}`);
    return {
      application_id:    app.id,
      status:            app.status,
      collab_status:     app.collab_status,
      created_at:        app.created_at,
      updated_at:        app.updated_at,
      collab_title:      collab?.title ?? '',
      collab_type:       collab?.collab_type ?? '',
      budget_min:        collab?.budget_min ?? null,
      budget_max:        collab?.budget_max ?? null,
      influencer_name:   profile?.display_name ?? '',
      influencer_avatar: profile?.avatar_url ?? null,
      influencer_city:   profile?.city ?? null,
      influencer_niches: profile?.niches ?? [],
      followers_ig:      profile?.followers_ig ?? 0,
      followers_tt:      profile?.followers_tt ?? 0,
      er_ig:             profile?.engagement_rate_ig ?? 0,
      er_tt:             profile?.engagement_rate_tt ?? 0,
      conversation_id:   conv?.id ?? null,
      last_message_at:   conv?.last_message_at ?? null,
      last_message:      conv?.last_message ?? null,
    };
  });

  const stats = {
    total:     applications.length,
    pending:   applications.filter(a => a.status === 'pending').length,
    accepted:  applications.filter(a => a.status === 'accepted').length,
    completed: applications.filter(a => a.collab_status === 'completed').length,
    rejected:  applications.filter(a => a.status === 'rejected').length,
  };

  return NextResponse.json({ applications, stats });
}
