import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const IG_HOST = 'instagram-scraper-20251.p.rapidapi.com';
const TT_HOST = 'tiktok-scraper7.p.rapidapi.com';

function rapidHeaders(host: string) {
  return {
    'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
    'x-rapidapi-host': host,
  };
}

function iqrFilter(vals: number[]): number[] {
  if (vals.length < 4) return vals;
  const s = [...vals].sort((a, b) => a - b);
  const q1 = s[Math.floor(s.length * 0.25)];
  const q3 = s[Math.floor(s.length * 0.75)];
  const iqr = q3 - q1;
  return s.filter(v => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr);
}

function avg(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

async function syncInstagram(handle: string) {
  const [infoRes, reelsRes] = await Promise.all([
    fetch(`https://${IG_HOST}/userinfo/?username_or_id=${encodeURIComponent(handle)}`, { headers: rapidHeaders(IG_HOST) }),
    fetch(`https://${IG_HOST}/userreels/?username_or_id=${encodeURIComponent(handle)}`, { headers: rapidHeaders(IG_HOST) }),
  ]);

  const infoData  = await infoRes.json();
  const reelsData = await reelsRes.json();

  const followers = infoData?.data?.follower_count ?? 0;
  const items     = (reelsData?.data?.items ?? []).slice(0, 12);

  const rawViews  = items.map((i: Record<string, number>) => i.play_count    || 0).filter(Boolean);
  const rawLikes  = items.map((i: Record<string, number>) => i.like_count    || 0).filter(Boolean);
  const rawCmts   = items.map((i: Record<string, number>) => i.comment_count || 0).filter(Boolean);

  const avgViews = avg(iqrFilter(rawViews));
  const avgLikes = avg(iqrFilter(rawLikes));
  const avgCmts  = avg(iqrFilter(rawCmts));
  const er       = followers > 0
    ? Math.round((avgLikes + avgCmts) / followers * 10000) / 100
    : 0;

  return { followers, avg_views: avgViews, avg_likes: avgLikes, er, posts_analyzed: items.length };
}

async function syncTikTok(handle: string) {
  const [infoRes, vidsRes] = await Promise.all([
    fetch(`https://${TT_HOST}/user/info?unique_id=${encodeURIComponent(handle)}`, { headers: rapidHeaders(TT_HOST) }),
    fetch(`https://${TT_HOST}/user/posts?unique_id=${encodeURIComponent(handle)}&count=12`, { headers: rapidHeaders(TT_HOST) }),
  ]);

  const infoData = await infoRes.json();
  const vidsData = await vidsRes.json();

  const followers = infoData?.data?.stats?.followerCount ?? 0;
  const items     = (vidsData?.data?.videos ?? []).slice(0, 12);

  const rawViews = items.map((v: Record<string, number>) => v.play_count    || 0).filter(Boolean);
  const rawLikes = items.map((v: Record<string, number>) => v.digg_count    || 0).filter(Boolean);
  const rawCmts  = items.map((v: Record<string, number>) => v.comment_count || 0).filter(Boolean);

  const avgViews = avg(iqrFilter(rawViews));
  const avgLikes = avg(iqrFilter(rawLikes));
  const avgCmts  = avg(iqrFilter(rawCmts));
  const er       = followers > 0
    ? Math.round((avgLikes + avgCmts) / followers * 10000) / 100
    : 0;

  return { followers, avg_views: avgViews, avg_likes: avgLikes, er, posts_analyzed: items.length };
}

export async function POST(req: NextRequest) {
  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json({ error: 'RAPIDAPI_KEY no configurada en Vercel' }, { status: 500 });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from('influencer_profiles')
    .select('instagram_handle, tiktok_handle')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });

  const { instagram_handle, tiktok_handle } = profile;
  if (!instagram_handle && !tiktok_handle) {
    return NextResponse.json({ error: 'Añade al menos un handle de Instagram o TikTok antes de sincronizar' }, { status: 400 });
  }

  const update: Record<string, unknown> = { last_sync_at: new Date().toISOString() };
  const result: Record<string, unknown> = {};

  if (instagram_handle) {
    try {
      const ig = await syncInstagram(instagram_handle);
      Object.assign(update, {
        followers_ig:       ig.followers,
        avg_views_ig:       ig.avg_views,
        avg_likes_ig:       ig.avg_likes,
        engagement_rate_ig: ig.er,
      });
      result.ig = ig;
    } catch (e) {
      result.ig_error = e instanceof Error ? e.message : 'Error sincronizando Instagram';
    }
  }

  if (tiktok_handle) {
    try {
      const tt = await syncTikTok(tiktok_handle);
      Object.assign(update, {
        followers_tt:       tt.followers,
        avg_views_tt:       tt.avg_views,
        avg_likes_tt:       tt.avg_likes,
        engagement_rate_tt: tt.er,
      });
      result.tt = tt;
    } catch (e) {
      result.tt_error = e instanceof Error ? e.message : 'Error sincronizando TikTok';
    }
  }

  const { error: updateErr } = await supabaseAdmin
    .from('influencer_profiles')
    .update(update)
    .eq('user_id', user.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, last_sync_at: update.last_sync_at, ...result });
}
