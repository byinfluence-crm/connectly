import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export interface InboxItem {
  application_id: string;
  collab_title: string;
  other_name: string;
  other_avatar: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  last_message_mine: boolean | null;
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: mu } = await supabaseAdmin
    .from('marketplace_users')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!mu || !['brand', 'influencer'].includes(mu.user_type)) {
    return NextResponse.json({ items: [] });
  }

  try {
    const items = mu.user_type === 'brand'
      ? await getBrandInbox(user.id)
      : await getCreatorInbox(user.id);
    return NextResponse.json({ items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function getLastMessages(convIds: string[], currentUserId: string) {
  if (!convIds.length) return new Map<string, { content: string; created_at: string; sender_user_id: string }>();

  const { data: msgs } = await supabaseAdmin
    .from('messages')
    .select('conversation_id, content, created_at, sender_user_id')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false });

  const map = new Map<string, { content: string; created_at: string; sender_user_id: string }>();
  for (const m of msgs ?? []) {
    if (!map.has(m.conversation_id)) map.set(m.conversation_id, m);
  }
  return map;
}

function sortByLastMessage(items: InboxItem[]): InboxItem[] {
  return items.sort((a, b) => {
    if (!a.last_message_at && !b.last_message_at) return 0;
    if (!a.last_message_at) return 1;
    if (!b.last_message_at) return -1;
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });
}

async function getBrandInbox(userId: string): Promise<InboxItem[]> {
  const { data: bp } = await supabaseAdmin
    .from('brand_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: apps } = await supabaseAdmin
    .from('collab_applications')
    .select('id, collaboration_id, influencer_profile_id')
    .eq('brand_id', userId)
    .eq('status', 'accepted');

  if (!apps?.length) return [];

  const influencerIds = [...new Set(apps.map(a => a.influencer_profile_id))];
  const collabIds = [...new Set(apps.map(a => a.collaboration_id))];

  const [{ data: influencers }, { data: collabs }] = await Promise.all([
    supabaseAdmin.from('influencer_profiles').select('id, display_name, avatar_url').in('id', influencerIds),
    supabaseAdmin.from('collaborations').select('id, title').in('id', collabIds),
  ]);

  const convMap = new Map<string, { id: string; last_message_at: string | null }>();
  if (bp?.id) {
    const { data: convs } = await supabaseAdmin
      .from('conversations')
      .select('id, collaboration_id, influencer_profile_id, last_message_at')
      .eq('brand_profile_id', bp.id);

    for (const c of convs ?? []) {
      convMap.set(`${c.collaboration_id}_${c.influencer_profile_id}`, c);
    }
  }

  const convIds = [...convMap.values()].map(c => c.id);
  const lastMsgMap = await getLastMessages(convIds, userId);

  const items = apps.map(app => {
    const influencer = influencers?.find(i => i.id === app.influencer_profile_id);
    const collab = collabs?.find(c => c.id === app.collaboration_id);
    const conv = convMap.get(`${app.collaboration_id}_${app.influencer_profile_id}`);
    const lastMsg = conv ? lastMsgMap.get(conv.id) : undefined;

    return {
      application_id: app.id,
      collab_title: collab?.title ?? 'Colaboración',
      other_name: influencer?.display_name ?? 'Creador',
      other_avatar: influencer?.avatar_url ?? null,
      last_message_content: lastMsg?.content ?? null,
      last_message_at: lastMsg?.created_at ?? conv?.last_message_at ?? null,
      last_message_mine: lastMsg != null ? lastMsg.sender_user_id === userId : null,
    };
  });

  return sortByLastMessage(items);
}

async function getCreatorInbox(userId: string): Promise<InboxItem[]> {
  const { data: ip } = await supabaseAdmin
    .from('influencer_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!ip) return [];

  const { data: apps } = await supabaseAdmin
    .from('collab_applications')
    .select('id, collaboration_id, brand_id')
    .eq('influencer_profile_id', ip.id)
    .eq('status', 'accepted');

  if (!apps?.length) return [];

  const brandUserIds = [...new Set(apps.map(a => a.brand_id))];
  const collabIds = [...new Set(apps.map(a => a.collaboration_id))];

  const [{ data: brandProfiles }, { data: collabs }] = await Promise.all([
    supabaseAdmin.from('brand_profiles').select('user_id, brand_name, logo_url').in('user_id', brandUserIds),
    supabaseAdmin.from('collaborations').select('id, title').in('id', collabIds),
  ]);

  const { data: convs } = await supabaseAdmin
    .from('conversations')
    .select('id, collaboration_id, last_message_at')
    .eq('influencer_profile_id', ip.id);

  const convMap = new Map<string, { id: string; last_message_at: string | null }>();
  for (const c of convs ?? []) {
    convMap.set(c.collaboration_id, c);
  }

  const convIds = [...convMap.values()].map(c => c.id);
  const lastMsgMap = await getLastMessages(convIds, userId);

  const items = apps.map(app => {
    const brand = brandProfiles?.find(b => b.user_id === app.brand_id);
    const collab = collabs?.find(c => c.id === app.collaboration_id);
    const conv = convMap.get(app.collaboration_id);
    const lastMsg = conv ? lastMsgMap.get(conv.id) : undefined;

    return {
      application_id: app.id,
      collab_title: collab?.title ?? 'Colaboración',
      other_name: brand?.brand_name ?? 'Marca',
      other_avatar: brand?.logo_url ?? null,
      last_message_content: lastMsg?.content ?? null,
      last_message_at: lastMsg?.created_at ?? conv?.last_message_at ?? null,
      last_message_mine: lastMsg != null ? lastMsg.sender_user_id === userId : null,
    };
  });

  return sortByLastMessage(items);
}
