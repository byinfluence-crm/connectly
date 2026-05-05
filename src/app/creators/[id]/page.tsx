'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, BadgeCheck, Flame, Star,
  TrendingUp, Users, BarChart3, ExternalLink, Send, CheckCircle, MessageCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import { getPublicProfile, getReviewsForCreator, getOrCreateDirectConversation } from '@/lib/supabase';
import type { PublicProfile, Review } from '@/lib/supabase';

function formatK(n: number) {
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);
}

function getPortfolioPics(seed: string) {
  return Array.from({ length: 9 }, (_, i) => `https://picsum.photos/seed/${seed}-p${i}/300/300`);
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={12}
          className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

// ─── ContactModal ─────────────────────────────────────────────────────────────

function ContactModal({
  profile, onClose,
}: {
  profile: PublicProfile;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    setSending(true);
    try {
      const res = await authFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_user_id: profile.id, message: message.trim() || null }),
      });
      if (res.ok) setSent(true);
    } finally {
      setSending(false);
    }
  };

  const coverSeed = `cover-${profile.id.slice(0, 6)}`;
  const avatarSrc = profile.avatar_url ?? `https://picsum.photos/seed/avatar-${profile.id.slice(0, 6)}/200/200`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="relative h-36 overflow-hidden">
          <img src={`https://picsum.photos/seed/${coverSeed}/600/300`} alt="" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
            <img src={avatarSrc} alt="" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow" />
            <div>
              <div className="text-white font-bold text-sm">{profile.display_name}</div>
              <div className="text-white/70 text-xs">{profile.niche ?? 'Creador'} · {profile.city ?? 'España'}</div>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors text-lg leading-none">×</button>
        </div>
        <div className="p-5">
          {sent ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🎉</div>
              <div className="font-bold text-gray-900 mb-1">¡Solicitud enviada!</div>
              <div className="text-sm text-gray-500 mb-5">
                {profile.display_name} recibirá tu mensaje y podrá responder desde su panel.
              </div>
              <Button fullWidth size="md" onClick={onClose}><CheckCircle size={15} /> Entendido</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <div className="text-sm font-bold text-gray-900">{formatK(profile.followers_ig ?? 0)}</div>
                  <div className="text-xs text-gray-400">Seguidores</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                  <div className="text-sm font-bold text-emerald-600">{profile.engagement_rate_ig?.toFixed(1) ?? '—'}%</div>
                  <div className="text-xs text-gray-400">Engagement</div>
                </div>
                <div className="bg-violet-50 rounded-xl p-2.5 text-center">
                  <div className="text-sm font-bold text-violet-700">{profile.price_min ?? '—'}€</div>
                  <div className="text-xs text-gray-400">Desde</div>
                </div>
              </div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Cuéntale sobre tu campaña <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tipo de colaboración, producto, fechas aproximadas…"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none mb-4"
              />
              <Button fullWidth size="md" loading={sending} onClick={handleSubmit}>
                <Send size={15} /> Enviar solicitud
              </Button>
              <p className="text-center text-xs text-gray-400 mt-2">
                {profile.display_name} podrá aceptar desde su panel de Connectly
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const handleOpenChat = async () => {
    if (!user?.id || !profile) return;
    setChatLoading(true);
    try {
      const conv = await getOrCreateDirectConversation(user.id, profile.id);
      router.push(`/chat/direct/${conv.id}`);
    } catch {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([getPublicProfile(id), getReviewsForCreator(id)])
      .then(([data, revs]) => {
        if (!data) {
          setNotFound(true);
          return;
        }
        if (data.user_type !== 'influencer') {
          router.replace(`/brands/${id}`);
          return;
        }
        setProfile(data);
        setReviews(revs);
      })
      .catch(err => {
        console.error('Error loading creator profile:', err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    const isSelf = user?.id === id;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            {isSelf ? 'Tu perfil aún no está configurado' : 'Perfil no encontrado'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {isSelf
              ? 'Tu cuenta se creó correctamente, pero falta completar el perfil público. Esto debería ocurrir automáticamente. Si persiste, contacta con soporte.'
              : 'Este creador no existe o ya no está disponible.'}
          </p>
          <Link
            href={isSelf ? '/dashboard/creator' : '/discover'}
            className="inline-block px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
          >
            {isSelf ? 'Volver al dashboard' : 'Ver otros creadores'}
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwn = user?.id === id;
  const isGuest = !user;
  const isBrand = user?.user_metadata?.user_type === 'brand';

  const avatarSrc = profile.avatar_url ?? `https://picsum.photos/seed/avatar-${profile.id.slice(0, 6)}/200/200`;
  const coverSeed = `cover-${profile.id.slice(0, 6)}`;
  const portfolioPics = profile.portfolio_urls.length > 0
    ? profile.portfolio_urls
    : getPortfolioPics(profile.id.slice(0, 8));

  const followersDisplay = profile.followers_ig ? formatK(profile.followers_ig) : '—';
  const erDisplay = profile.engagement_rate_ig ? `${profile.engagement_rate_ig.toFixed(1)}%` : '—';
  const avgReachDisplay = profile.followers_ig && profile.engagement_rate_ig
    ? formatK(Math.round(profile.followers_ig * (profile.engagement_rate_ig / 100)))
    : '—';

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : profile.rating_avg > 0 ? profile.rating_avg.toFixed(1) : '4.8';

  const handle = profile.instagram_handle ? `@${profile.instagram_handle}` : null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-gray-900 flex-1 truncate">{profile.display_name}</span>
          <Link href="/" className="flex items-center">
            <img src="/mark-only.svg" alt="Connectly" className="h-6 w-auto" />
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">

        {/* ── Hero / Cover ── */}
        <div className="relative mb-0">
          <div className="h-44 sm:h-56 w-full overflow-hidden rounded-b-3xl bg-gradient-to-br from-violet-400 to-violet-700">
            <img
              src={`https://picsum.photos/seed/${coverSeed}/900/400`}
              alt="cover"
              className="w-full h-full object-cover opacity-70"
            />
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-5">
            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
              <img
                src={avatarSrc}
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Badges */}
          <div className="absolute -bottom-4 right-5 flex items-center gap-2">
            {profile.is_boosted && (
              <span className="flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                <Flame size={10} fill="white" /> Destacado
              </span>
            )}
            {profile.is_verified && (
              <span className="flex items-center gap-1 bg-sky-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                <BadgeCheck size={11} /> Verificado
              </span>
            )}
          </div>
        </div>

        {/* ── Identity ── */}
        <div className="mt-16 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {profile.display_name}
              {profile.is_verified && <BadgeCheck size={18} className="text-sky-500" />}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {profile.niche && (
                <Badge variant="default" size="sm">{profile.niche}</Badge>
              )}
              {handle && (
                <span className="text-xs text-violet-600 font-medium">{handle}</span>
              )}
              {profile.city && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={11} /> {profile.city}
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          {isOwn ? (
            <Link href="/dashboard/creator">
              <Button size="sm" variant="outline">Editar perfil</Button>
            </Link>
          ) : isBrand ? (
            <Button size="sm" loading={chatLoading} onClick={handleOpenChat}>
              <MessageCircle size={14} /> Chat directo
            </Button>
          ) : isGuest ? (
            <Link href="/register">
              <Button size="sm">Regístrate gratis</Button>
            </Link>
          ) : null}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <StatBox icon={<Users size={16} className="text-violet-600" />} label="Seguidores" value={followersDisplay} />
          <StatBox icon={<TrendingUp size={16} className="text-emerald-600" />} label="Engagement" value={erDisplay} />
          <StatBox icon={<BarChart3 size={16} className="text-amber-600" />} label="Alcance medio" value={avgReachDisplay} />
        </div>

        {/* ── Sobre mí ── */}
        <section className="mt-8">
          <h2 className="text-sm font-bold text-gray-900 mb-2">Sobre mí</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {profile.bio ?? `Creador de contenido especializado en ${profile.niche ?? 'contenido digital'}. Colaboro con marcas auténticas que encajan con mi comunidad para crear contenido que conecta de verdad.${profile.city ? ` Basado en ${profile.city}.` : ''}`}
          </p>
        </section>

        {/* ── Tarifas (solo marcas y propio) ── */}
        {(isBrand || isOwn) && (profile.price_min || profile.price_max) && (
          <section className="mt-6 bg-violet-50 border border-violet-100 rounded-2xl p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <BarChart3 size={14} className="text-violet-600" /> Tarifas orientativas
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl px-3 py-2.5 border border-violet-100">
                <div className="text-xs text-gray-500">Desde</div>
                <div className="text-sm font-bold text-gray-900">{profile.price_min ?? '—'}€</div>
              </div>
              <div className="bg-white rounded-xl px-3 py-2.5 border border-violet-100">
                <div className="text-xs text-gray-500">Hasta</div>
                <div className="text-sm font-bold text-gray-900">{profile.price_max ?? '—'}€</div>
              </div>
            </div>
          </section>
        )}

        {/* ── Portfolio ── */}
        <section className="mt-8">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Portfolio</h2>
          <div className="grid grid-cols-3 gap-1.5">
            {portfolioPics.map((src, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={src} alt={`portfolio ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </section>

        {/* ── Reseñas ── */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Reseñas de marcas</h2>
            <div className="flex items-center gap-1.5">
              <Stars rating={Math.round(Number(avgRating))} />
              <span className="text-xs font-bold text-gray-700">{avgRating}</span>
              <span className="text-xs text-gray-400">({reviews.length > 0 ? reviews.length : profile.total_reviews})</span>
            </div>
          </div>
          {reviews.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-center">
              <p className="text-xs text-gray-400">Aún no hay reseñas. Se publicarán tras las primeras colaboraciones.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r, i) => {
                const name = (r as Review & { reviewer?: { display_name: string } | null }).reviewer?.display_name ?? 'Marca';
                const logo = `https://picsum.photos/seed/rev-${String(r.id).slice(0, 6)}/40/40`;
                const date = new Date(r.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                return (
                  <div key={r.id ?? i} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={logo} alt={name} className="w-8 h-8 rounded-xl object-cover" />
                      <div>
                        <div className="text-xs font-bold text-gray-900">{name}</div>
                        <Stars rating={r.rating} />
                      </div>
                      <span className="ml-auto text-xs text-gray-400">{date}</span>
                    </div>
                    {r.comment && <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>}
                    {r.would_repeat !== null && (
                      <span className={`inline-flex items-center gap-1 mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        r.would_repeat ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                      }`}>
                        {r.would_repeat ? '👍 Repetiría' : '👎 No repetiría'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── CTA bottom (guest / brand) ── */}
        {isGuest && (
          <div className="mt-10 bg-gradient-to-r from-violet-600 to-violet-800 rounded-2xl p-5 text-center">
            <div className="text-white font-bold mb-1">¿Eres una marca?</div>
            <p className="text-violet-200 text-sm mb-4">Regístrate gratis y contacta con {profile.display_name} directamente en Connectly.</p>
            <Link href="/register">
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 mx-auto">
                Crear cuenta gratuita <ExternalLink size={13} />
              </Button>
            </Link>
          </div>
        )}

        {isBrand && (
          <div className="mt-10 bg-gradient-to-r from-violet-600 to-violet-800 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-white font-bold mb-1">¿Te interesa este creador?</div>
              <div className="text-violet-200 text-sm">Abre un chat directo y coordina la colaboración.</div>
            </div>
            <Button
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10 flex-shrink-0"
              loading={chatLoading}
              onClick={handleOpenChat}
            >
              <MessageCircle size={13} /> Chatear
            </Button>
          </div>
        )}

      </div>

      {showContact && profile && (
        <ContactModal profile={profile} onClose={() => setShowContact(false)} />
      )}
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-base font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
