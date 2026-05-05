'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, BadgeCheck, Flame, Star,
  Calendar, Wallet, Tag, ExternalLink, ChevronRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';
import { getPublicProfile, getBrandActiveCollabs, getReviewsForBrand } from '@/lib/supabase';
import type { PublicProfile, Review, PublicCollaboration } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  canje: 'Canje',
  pago: 'Pago',
  mixto: 'Canje + Pago',
};

function budgetLabel(c: PublicCollaboration): string {
  if (c.collab_type === 'canje') return 'Canje';
  if (!c.budget_min && !c.budget_max) return 'A convenir';
  if (c.budget_min && c.budget_max && c.budget_min === c.budget_max) return `${c.budget_min}€`;
  if (c.budget_min && c.budget_max) return `${c.budget_min}-${c.budget_max}€`;
  return `${c.budget_min ?? c.budget_max}€`;
}

function fmtDate(d: string | null): string {
  if (!d) return 'sin fecha';
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ─── Mock reviews ────────────────────────────────────────────────────────────

const MOCK_REVIEWS = [
  {
    id: 1, creator: 'Laura Sánchez', rating: 5,
    text: 'Marca muy profesional. Briefing claro, pago puntual y excelente comunicación.',
    date: 'marzo 2026', img: 'https://picsum.photos/seed/laura-br/40/40',
  },
  {
    id: 2, creator: 'Carlos M.', rating: 5,
    text: 'Una de las mejores colaboraciones que he tenido. Repito seguro.',
    date: 'febrero 2026', img: 'https://picsum.photos/seed/carlos-br/40/40',
  },
  {
    id: 3, creator: 'Ana Martín', rating: 4,
    text: 'Buena experiencia en general. El producto es de alta calidad.',
    date: 'enero 2026', img: 'https://picsum.photos/seed/ana-br/40/40',
  },
];

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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BrandProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [collabs, setCollabs] = useState<PublicCollaboration[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getPublicProfile(id), getBrandActiveCollabs(id), getReviewsForBrand(id)])
      .then(([p, c, revs]) => {
        if (!p || p.user_type !== 'brand') {
          router.replace('/discover');
          return;
        }
        setProfile(p);
        setCollabs(c);
        setReviews(revs);
      })
      .catch(() => router.replace('/discover'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const isOwn = user?.id === id;
  const isGuest = !user;
  const isCreator = user?.user_metadata?.user_type === 'influencer';
  const realReviews = reviews.length > 0 ? reviews : MOCK_REVIEWS;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8';
  const coverSeed = `brand-cover-${profile.id.slice(0, 6)}`;
  const logoSeed = `brand-logo-${profile.id.slice(0, 6)}`;

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

        {/* ── Hero ── */}
        <div className="relative mb-0">
          <div className="h-40 sm:h-52 w-full overflow-hidden rounded-b-3xl bg-gradient-to-br from-violet-400 to-violet-700">
            <img
              src={`https://picsum.photos/seed/${coverSeed}/900/400`}
              alt="cover"
              className="w-full h-full object-cover opacity-60"
            />
          </div>

          {/* Logo */}
          <div className="absolute -bottom-12 left-5">
            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
              <img
                src={`https://picsum.photos/seed/${logoSeed}/200/200`}
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Badges */}
          <div className="absolute -bottom-4 right-5 flex items-center gap-2">
            {profile.is_boosted && (
              <span className="flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                <Flame size={10} fill="white" /> Destacada
              </span>
            )}
            {profile.is_verified && (
              <span className="flex items-center gap-1 bg-sky-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                <BadgeCheck size={11} /> Verificada
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
              {profile.city && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={11} /> {profile.city}
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          {isOwn ? (
            <Link href="/dashboard/brand">
              <Button size="sm" variant="outline">Editar perfil</Button>
            </Link>
          ) : isCreator ? (
            <Link href="/discover">
              <Button size="sm">Ver colaboraciones</Button>
            </Link>
          ) : isGuest ? (
            <Link href="/register?role=influencer">
              <Button size="sm">Regístrate gratis</Button>
            </Link>
          ) : null}
        </div>

        {/* ── About ── */}
        <section className="mt-6">
          <h2 className="text-sm font-bold text-gray-900 mb-2">Sobre la marca</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Marca especializada en {profile.niche ?? 'su sector'}.
            Buscamos creadores auténticos que compartan nuestros valores para colaboraciones genuinas y a largo plazo.
            {profile.city ? ` Operamos principalmente en ${profile.city} y alrededores.` : ''}
          </p>
        </section>

        {/* ── Rating ── */}
        <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="text-3xl font-bold text-gray-900">{avgRating}</div>
          <div>
            <Stars rating={Math.round(Number(avgRating))} />
            <div className="text-xs text-gray-400 mt-0.5">{realReviews.length} reseñas de creadores</div>
          </div>
          <div className="ml-auto flex gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-gray-900">{collabs.length > 0 ? collabs.length : '5+'}</div>
              <div className="text-[10px] text-gray-400">Campañas</div>
            </div>
            <div className="w-px bg-gray-100" />
            <div>
              <div className="text-sm font-bold text-gray-900">100%</div>
              <div className="text-[10px] text-gray-400">Pago ok</div>
            </div>
          </div>
        </div>

        {/* ── Active collabs ── */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Colaboraciones activas</h2>
            {collabs.length > 0 && (
              <Link href="/discover" className="text-xs text-violet-600 font-semibold flex items-center gap-0.5 hover:text-violet-700">
                Ver en discover <ChevronRight size={13} />
              </Link>
            )}
          </div>

          {collabs.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-center">
              <div className="text-xs text-gray-400">No hay colaboraciones activas en este momento</div>
            </div>
          ) : (
            <div className="space-y-3">
              {collabs.map(c => (
                <div
                  key={c.id}
                  className={`bg-white border rounded-2xl p-4 shadow-sm ${
                    c.is_boosted ? 'border-violet-200 ring-2 ring-violet-50' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {c.is_boosted && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
                            <Flame size={8} /> Destacada
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          c.collab_type === 'pago' ? 'bg-emerald-50 text-emerald-700' :
                          c.collab_type === 'canje' ? 'bg-amber-50 text-amber-700' :
                          'bg-violet-50 text-violet-700'
                        }`}>
                          {TYPE_LABELS[c.collab_type] ?? c.collab_type}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 leading-snug">{c.title}</div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-gray-400">
                        <span className="flex items-center gap-0.5"><Tag size={10} /> {c.niches_required?.[0] ?? '—'}</span>
                        <span className="flex items-center gap-0.5"><MapPin size={10} /> {c.city ?? '—'}</span>
                        <span className="flex items-center gap-0.5"><Calendar size={10} /> Hasta {fmtDate(c.deadline)}</span>
                        <span className="flex items-center gap-0.5"><Wallet size={10} /> {budgetLabel(c)}</span>
                      </div>
                    </div>
                    {(isCreator || isGuest) && (
                      <Link href={isGuest ? '/register?role=influencer' : '/discover'}>
                        <Button size="sm" className="flex-shrink-0 text-xs">Aplicar</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Reviews ── */}
        <section className="mt-8">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Reseñas de creadores</h2>
          {realReviews.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-center">
              <p className="text-xs text-gray-400">Aún no hay reseñas. Se publicarán tras las primeras colaboraciones.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {realReviews.map((r, i) => {
                const isReal = reviews.length > 0;
                const name = isReal
                  ? (r as Review & { reviewer?: { display_name: string } | null }).reviewer?.display_name ?? 'Creador'
                  : (r as typeof MOCK_REVIEWS[0]).creator;
                const img = isReal ? `https://picsum.photos/seed/rev-${String(r.id).slice(0, 6)}/40/40` : (r as typeof MOCK_REVIEWS[0]).img;
                const text = isReal ? (r as Review).comment ?? '' : (r as typeof MOCK_REVIEWS[0]).text;
                const date = isReal
                  ? new Date((r as Review).created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                  : (r as typeof MOCK_REVIEWS[0]).date;
                return (
                  <div key={r.id ?? i} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={img} alt={name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="text-xs font-bold text-gray-900">{name}</div>
                        <Stars rating={r.rating} />
                      </div>
                      <span className="ml-auto text-xs text-gray-400">{date}</span>
                    </div>
                    {text && <p className="text-xs text-gray-600 leading-relaxed">{text}</p>}
                    {isReal && (r as Review).would_repeat !== null && (
                      <span className={`inline-flex items-center gap-1 mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        (r as Review).would_repeat ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                      }`}>
                        {(r as Review).would_repeat ? '👍 Repetiría' : '👎 No repetiría'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── CTA bottom (creator or guest) ── */}
        {(isCreator || isGuest) && (
          <div className="mt-10 bg-gradient-to-r from-violet-600 to-violet-800 rounded-2xl p-5 text-center">
            <div className="text-white font-bold mb-1">
              {isGuest ? '¿Eres creador de contenido?' : `¿Te interesa colaborar con ${profile.display_name}?`}
            </div>
            <p className="text-violet-200 text-sm mb-4">
              {isGuest
                ? 'Regístrate gratis y empieza a aplicar a sus colaboraciones.'
                : 'Aplica a sus colaboraciones activas directamente en Connectly.'}
            </p>
            <Link href={isGuest ? '/register?role=influencer' : '/discover'}>
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 mx-auto">
                {isGuest ? 'Crear cuenta gratuita' : 'Ver colaboraciones'} <ExternalLink size={13} />
              </Button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
