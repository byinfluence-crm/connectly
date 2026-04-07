'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, BadgeCheck, Flame, Star,
  TrendingUp, Users, BarChart3, ExternalLink,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';
import { getPublicProfile } from '@/lib/supabase';
import type { PublicProfile } from '@/lib/supabase';

// ─── Mock data supplementing real profile ────────────────────────────────────

const NICHE_STATS: Record<string, { followers: string; er: string; avgReach: string }> = {
  Moda:        { followers: '48,2K', er: '4,2%', avgReach: '12,4K' },
  Fitness:     { followers: '91,0K', er: '3,8%', avgReach: '24,1K' },
  Gastronomía: { followers: '32,5K', er: '5,1%', avgReach: '9,8K' },
  Bienestar:   { followers: '18,3K', er: '7,4%', avgReach: '6,2K' },
  Belleza:     { followers: '29,8K', er: '5,8%', avgReach: '8,7K' },
  Tecnología:  { followers: '55,1K', er: '2,9%', avgReach: '16,0K' },
  Viajes:      { followers: '72,4K', er: '4,6%', avgReach: '21,3K' },
  default:     { followers: '25,0K', er: '4,5%', avgReach: '7,5K' },
};

const MOCK_REVIEWS = [
  {
    id: 1, brand: 'Casa Nova', rating: 5, text: 'Increíble trabajo, muy profesional y el contenido superó nuestras expectativas.',
    date: 'marzo 2026', logo: 'https://picsum.photos/seed/casanova-r/40/40',
  },
  {
    id: 2, brand: 'SkinGlow', rating: 5, text: 'Muy buena comunicación y entrega puntual. Repetiremos sin duda.',
    date: 'febrero 2026', logo: 'https://picsum.photos/seed/skinglow-r/40/40',
  },
  {
    id: 3, brand: 'ActiveWear', rating: 4, text: 'Buen contenido, creativo y con buen engagement. Lo recomendamos.',
    date: 'enero 2026', logo: 'https://picsum.photos/seed/active-r/40/40',
  },
];

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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getPublicProfile(id)
      .then(data => {
        if (!data || data.user_type !== 'influencer') {
          router.replace('/discover');
          return;
        }
        setProfile(data);
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
  const isBrand = user?.user_metadata?.user_type === 'brand';

  const stats = NICHE_STATS[profile.niche ?? ''] ?? NICHE_STATS.default;
  const portfolioPics = getPortfolioPics(profile.id.slice(0, 8));
  const avgRating = 4.8;
  const coverSeed = `cover-${profile.id.slice(0, 6)}`;
  const avatarSeed = `avatar-${profile.id.slice(0, 6)}`;

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
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
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
                src={`https://picsum.photos/seed/${avatarSeed}/200/200`}
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
            <Link href="/discover">
              <Button size="sm">Contactar</Button>
            </Link>
          ) : isGuest ? (
            <Link href="/register">
              <Button size="sm">Regístrate gratis</Button>
            </Link>
          ) : null}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <StatBox icon={<Users size={16} className="text-violet-600" />} label="Seguidores" value={stats.followers} />
          <StatBox icon={<TrendingUp size={16} className="text-emerald-600" />} label="Engagement" value={stats.er} />
          <StatBox icon={<BarChart3 size={16} className="text-amber-600" />} label="Alcance medio" value={stats.avgReach} />
        </div>

        {/* ── Sobre mí ── */}
        <section className="mt-8">
          <h2 className="text-sm font-bold text-gray-900 mb-2">Sobre mí</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Creador de contenido especializado en {profile.niche ?? 'contenido digital'}.
            Colaboro con marcas auténticas que encajan con mi comunidad para crear contenido que conecta de verdad.
            {profile.city ? ` Basado en ${profile.city}.` : ''}
          </p>
        </section>

        {/* ── Tarifas (solo marcas y propio) ── */}
        {(isBrand || isOwn) && (
          <section className="mt-6 bg-violet-50 border border-violet-100 rounded-2xl p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <BarChart3 size={14} className="text-violet-600" /> Tarifas orientativas
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { tipo: 'Story (x3)', precio: '80–150€' },
                { tipo: 'Reel / Video', precio: '200–400€' },
                { tipo: 'Post feed', precio: '120–250€' },
                { tipo: 'Pack campaña', precio: 'desde 500€' },
              ].map(r => (
                <div key={r.tipo} className="bg-white rounded-xl px-3 py-2.5 border border-violet-100">
                  <div className="text-xs text-gray-500">{r.tipo}</div>
                  <div className="text-sm font-bold text-gray-900">{r.precio}</div>
                </div>
              ))}
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
              <Stars rating={5} />
              <span className="text-xs font-bold text-gray-700">{avgRating}</span>
              <span className="text-xs text-gray-400">({MOCK_REVIEWS.length})</span>
            </div>
          </div>
          <div className="space-y-3">
            {MOCK_REVIEWS.map(r => (
              <div key={r.id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <img src={r.logo} alt={r.brand} className="w-8 h-8 rounded-xl object-cover" />
                  <div>
                    <div className="text-xs font-bold text-gray-900">{r.brand}</div>
                    <Stars rating={r.rating} />
                  </div>
                  <span className="ml-auto text-xs text-gray-400">{r.date}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA bottom (guest) ── */}
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

      </div>
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
