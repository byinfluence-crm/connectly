'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useCredits } from '@/lib/hooks/useCredits';
import {
  Search, SlidersHorizontal, Star, Shield, Zap, MapPin,
  Users, TrendingUp, Lock, MessageCircle, ChevronRight, Flame
} from 'lucide-react';

// userId provisional hasta que Auth esté conectado
const MOCK_USER_ID: string | null = null;

/* ─── MOCK DATA ────────────────────────────────────────────────────── */
// Imágenes: picsum.photos (licencia CC0 — sin copyright, uso libre)
const INFLUENCERS = [
  {
    id: 1, name: 'Laura Sánchez', handle: '@laurastyle', niche: 'Moda', city: 'Madrid',
    followers: 48200, er: 4.2, priceMin: 150, priceMax: 400,
    verified: true, rating: 4.9, reviews: 23, available: true, featured: true, free: false,
    email: 'laura@laurastyle.es', phone: '+34 612 345 678',
    img: 'https://picsum.photos/seed/laura-s/400/500',
    cover: 'https://picsum.photos/seed/moda-cover1/600/400',
  },
  {
    id: 2, name: 'Carlos Ruiz', handle: '@carlosfoodie', niche: 'Gastronomía', city: 'Sevilla',
    followers: 23500, er: 6.1, priceMin: 80, priceMax: 200,
    verified: true, rating: 5.0, reviews: 18, available: true, featured: true, free: false,
    email: 'carlos@carlosfoodie.com', phone: '+34 622 111 222',
    img: 'https://picsum.photos/seed/carlos-r/400/500',
    cover: 'https://picsum.photos/seed/food-cover2/600/400',
  },
  {
    id: 3, name: 'Ana Martín', handle: '@anafit', niche: 'Fitness', city: 'Barcelona',
    followers: 91000, er: 3.8, priceMin: 300, priceMax: 700,
    verified: false, rating: 4.7, reviews: 41, available: false, featured: false, free: true,
    email: 'ana@anafit.es', phone: '+34 633 222 333',
    img: 'https://picsum.photos/seed/ana-m/400/500',
    cover: 'https://picsum.photos/seed/fitness-cover3/600/400',
  },
  {
    id: 4, name: 'Sofía López', handle: '@sofiatravel', niche: 'Viajes', city: 'Valencia',
    followers: 34700, er: 5.3, priceMin: 120, priceMax: 350,
    verified: true, rating: 4.8, reviews: 29, available: true, featured: false, free: true,
    email: 'sofia@sofiatravel.es', phone: '+34 644 333 444',
    img: 'https://picsum.photos/seed/sofia-l/400/500',
    cover: 'https://picsum.photos/seed/travel-cover4/600/400',
  },
  {
    id: 5, name: 'Pablo Torres', handle: '@pablostyle', niche: 'Moda', city: 'Madrid',
    followers: 62100, er: 3.2, priceMin: 200, priceMax: 500,
    verified: true, rating: 4.6, reviews: 15, available: true, featured: false, free: true,
    email: 'pablo@pablostyle.es', phone: '+34 655 444 555',
    img: 'https://picsum.photos/seed/pablo-t/400/500',
    cover: 'https://picsum.photos/seed/moda-cover5/600/400',
  },
  {
    id: 6, name: 'Marta Vega', handle: '@martawellness', niche: 'Bienestar', city: 'Málaga',
    followers: 18300, er: 7.4, priceMin: 60, priceMax: 180,
    verified: false, rating: 4.9, reviews: 8, available: true, featured: false, free: true,
    email: 'marta@martawellness.com', phone: '+34 666 555 666',
    img: 'https://picsum.photos/seed/marta-v/400/500',
    cover: 'https://picsum.photos/seed/wellness-cover6/600/400',
  },
  {
    id: 7, name: 'Javier Ramos', handle: '@javiertech', niche: 'Tecnología', city: 'Barcelona',
    followers: 145000, er: 2.9, priceMin: 400, priceMax: 900,
    verified: true, rating: 4.5, reviews: 62, available: false, featured: false, free: true,
    email: 'javier@javiertech.io', phone: '+34 677 666 777',
    img: 'https://picsum.photos/seed/javier-r/400/500',
    cover: 'https://picsum.photos/seed/tech-cover7/600/400',
  },
  {
    id: 8, name: 'Elena Castro', handle: '@elenabeauty', niche: 'Belleza', city: 'Madrid',
    followers: 29800, er: 5.8, priceMin: 100, priceMax: 280,
    verified: true, rating: 4.8, reviews: 34, available: true, featured: false, free: true,
    email: 'elena@elenabeauty.es', phone: '+34 688 777 888',
    img: 'https://picsum.photos/seed/elena-c/400/500',
    cover: 'https://picsum.photos/seed/beauty-cover8/600/400',
  },
];

const COLLABS = [
  {
    id: 1, brand: 'Casa Nova', title: 'Foodie para reels de nueva carta de primavera', niche: 'Gastronomía',
    city: 'Sevilla', type: 'Canje', budget: null, boosted: true, applicants: 7, deadline: '30 abr',
    cover: 'https://picsum.photos/seed/restaurant-nova/600/400',
    logo: '', description: 'Renovamos carta y buscamos creador gastronómico local.',
    email: 'hola@casanova.es', web: 'casanova.es',
  },
  {
    id: 2, brand: 'Gymfit Studio', title: 'Campaña de lanzamiento de nuestra app de fitness', niche: 'Fitness',
    city: 'Madrid', type: 'Pago', budget: 300, boosted: false, applicants: 12, deadline: '15 may',
    cover: 'https://picsum.photos/seed/gym-studio/600/400',
    logo: '', description: 'Lanzamos app con 50K usuarios. Buscamos cara del movimiento.',
    email: 'marketing@gymfit.es', web: 'gymfit.es',
  },
  {
    id: 3, brand: 'Krave Clothing', title: 'Colección PV · buscamos perfil de moda urbana', niche: 'Moda',
    city: 'Barcelona', type: 'Ambos', budget: 200, boosted: true, applicants: 19, deadline: '20 abr',
    cover: 'https://picsum.photos/seed/krave-clothing/600/400',
    logo: '', description: 'Colección primavera-verano. Pago + ropa valorada en 300€.',
    email: 'collabs@kraveclothing.com', web: 'kraveclothing.com',
  },
  {
    id: 4, brand: 'SkinGlow', title: 'Embajadora para nueva gama de hidratantes premium', niche: 'Belleza',
    city: 'Remoto', type: 'Pago', budget: 250, boosted: true, applicants: 28, deadline: '25 abr',
    cover: 'https://picsum.photos/seed/skinglow-beauty/600/400',
    logo: '', description: 'Gama premium. 3 publicaciones + stories. Envío de producto incluido.',
    email: 'embajadoras@skinglow.es', web: 'skinglow.es',
  },
  {
    id: 5, brand: 'Naturalia Bio', title: 'Embajadores de bienestar para línea eco', niche: 'Bienestar',
    city: 'Remoto', type: 'Pago', budget: 150, boosted: false, applicants: 5, deadline: '10 may',
    cover: 'https://picsum.photos/seed/naturalia-eco/600/400',
    logo: '', description: 'Productos 100% ecológicos. Buscamos perfil auténtico y comprometido.',
    email: 'equipo@naturaliabio.com', web: 'naturaliabio.com',
  },
];

const NICHES = ['Todos', 'Gastronomía', 'Moda', 'Fitness', 'Viajes', 'Bienestar', 'Tecnología', 'Belleza'];
const CITIES = ['Todas', 'Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Málaga'];

function formatK(n: number) {
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);
}

/* ─── UNLOCK MODAL ─────────────────────────────────────────────────── */
function UnlockModal({
  inf, onClose, onUnlocked, credits, unlocking
}: {
  inf: typeof INFLUENCERS[0];
  onClose: () => void;
  onUnlocked: (id: string) => Promise<{ success: boolean; error_code?: string; credits_remaining?: number }>;
  credits: number | null;
  unlocking: boolean;
}) {
  const [result, setResult] = useState<'idle'|'ok'|'no_credits'>('idle');

  const handleUnlock = async () => {
    const res = await onUnlocked(String(inf.id));
    if (res?.success) {
      setResult('ok');
    } else if (res?.error_code === 'insufficient_credits') {
      setResult('no_credits');
    }
  };

  const hasCredits = credits !== null && credits >= 10;
  const isOk = result === 'ok';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Cover image — blurred if locked, sharp if unlocked */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={inf.cover}
            alt=""
            className={`w-full h-full object-cover transition-all duration-500 ${isOk ? 'scale-100' : 'scale-110 blur-sm'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <img
              src={inf.img}
              alt=""
              className={`w-12 h-12 rounded-full border-2 border-white object-cover transition-all duration-500 ${isOk ? '' : 'blur-sm'}`}
            />
            <div>
              <div
                className="text-white font-bold text-sm transition-all duration-500"
                style={isOk ? {} : { filter: 'blur(5px)' }}
              >
                {inf.name}
              </div>
              <div
                className="text-white/80 text-xs transition-all duration-500"
                style={isOk ? {} : { filter: 'blur(4px)' }}
              >
                {inf.handle}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors text-lg leading-none">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {isOk ? (
            /* ── Perfil desbloqueado: mostrar todos los datos ── */
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-base">🎉</div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">¡Perfil desbloqueado!</div>
                  <div className="text-xs text-gray-400">Ahora tienes acceso completo</div>
                </div>
              </div>

              {/* Datos completos */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                  <span className="text-base">👤</span>
                  <div>
                    <div className="text-xs text-gray-400">Nombre real</div>
                    <div className="text-sm font-semibold text-gray-900">{inf.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                  <span className="text-base">📧</span>
                  <div>
                    <div className="text-xs text-gray-400">Email de contacto</div>
                    <div className="text-sm font-semibold text-gray-900">{inf.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                  <span className="text-base">📱</span>
                  <div>
                    <div className="text-xs text-gray-400">Teléfono / WhatsApp</div>
                    <div className="text-sm font-semibold text-gray-900">{inf.phone}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-violet-50 rounded-xl text-center">
                    <div className="text-sm font-bold text-violet-700">{inf.priceMin}€ – {inf.priceMax}€</div>
                    <div className="text-xs text-gray-400">Tarifa por campaña</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-center">
                    <div className="text-sm font-bold text-emerald-600">{inf.er}% ER</div>
                    <div className="text-xs text-gray-400">{formatK(inf.followers)} seguidores</div>
                  </div>
                </div>
              </div>

              <Button fullWidth size="md" onClick={onClose}>
                <MessageCircle size={15} /> Ir al perfil completo
              </Button>
            </div>
          ) : (
            /* ── Perfil bloqueado: FOMO + botón desbloquear ── */
            <>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-violet-600" />
                  <span className="font-bold text-gray-900 text-base">Perfil bloqueado</span>
                </div>
                {credits !== null && (
                  <div className="flex items-center gap-1 bg-violet-50 text-violet-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    <Zap size={11} /> {credits} créditos
                  </div>
                )}
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Desbloquea para ver nombre, email, teléfono y tarifa exacta.
              </p>

              {/* Stats FOMO */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{formatK(inf.followers)}</div>
                  <div className="text-xs text-gray-400">Seguidores</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-emerald-600">{inf.er}%</div>
                  <div className="text-xs text-gray-400">Engagement</div>
                </div>
              </div>

              {result === 'no_credits' && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3 text-center">
                  <div className="text-sm font-semibold text-red-600">Créditos insuficientes</div>
                  <div className="text-xs text-red-400">Necesitas 10 créditos — tienes {credits}</div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button fullWidth size="md" loading={unlocking} onClick={handleUnlock}>
                  <Zap size={15} /> Desbloquear · 10 créditos
                </Button>
                <Button fullWidth size="md" variant="outline">
                  Ver planes de suscripción
                </Button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-3">
                Con el plan Starter tienes acceso ilimitado
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── INFLUENCER CARD ──────────────────────────────────────────────── */
function InfluencerCard({
  inf, featured, credits, unlocking, onUnlock, isUnlocked,
}: {
  inf: typeof INFLUENCERS[0];
  featured?: boolean;
  credits: number | null;
  unlocking: boolean;
  onUnlock: (id: string) => Promise<{ success: boolean; error_code?: string; credits_remaining?: number }>;
  isUnlocked: boolean;
}) {
  const locked = inf.free && !isUnlocked;
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        onClick={() => locked && setShowModal(true)}
        className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer ${featured ? 'border-violet-300 ring-2 ring-violet-100 shadow-md' : 'border-gray-100 shadow-sm'}`}
      >
        {/* Cover image — siempre nítida */}
        <div className="relative h-44 sm:h-48 overflow-hidden bg-gray-100">
          <img
            src={inf.cover}
            alt={inf.niche}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {featured && (
              <span className="flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                <Zap size={10} fill="white" /> Destacado
              </span>
            )}
            {inf.verified && (
              <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-violet-700 text-xs font-bold px-2 py-1 rounded-full">
                <Shield size={10} /> Pro
              </span>
            )}
          </div>

          {/* Bottom info — PANEL TRASLÚCIDO sobre nombre si bloqueado */}
          <div className="absolute bottom-0 left-0 right-0">
            {locked ? (
              /* Panel glassmorphism */
              <div
                className="flex items-center gap-2.5 px-3 py-2.5"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderTop: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                {/* Avatar borroso */}
                <img
                  src={inf.img}
                  alt=""
                  className="w-8 h-8 rounded-full border border-white/50 object-cover flex-shrink-0"
                  style={{ filter: 'blur(6px)' }}
                />
                <div className="flex-1 min-w-0">
                  {/* Nombre pixelado */}
                  <div
                    className="text-sm font-bold text-white leading-tight truncate select-none"
                    style={{ filter: 'blur(5px)', userSelect: 'none' }}
                  >
                    {inf.name}
                  </div>
                  <div
                    className="text-xs text-white/80 truncate select-none"
                    style={{ filter: 'blur(4px)', userSelect: 'none' }}
                  >
                    {inf.handle}
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                  <Lock size={11} className="text-white" />
                  <span className="text-white text-xs font-semibold">Ver</span>
                </div>
              </div>
            ) : (
              /* Panel normal sin blur */
              <div className="flex items-center gap-2.5 px-3 pb-3">
                <img
                  src={inf.img}
                  alt={inf.name}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white leading-tight truncate">{inf.name}</div>
                  <div className="text-xs text-white/80 truncate">{inf.handle}</div>
                </div>
                {inf.available && (
                  <span className="text-xs bg-emerald-500 text-white font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                    Libre
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Badge variant="default" size="sm">{inf.niche}</Badge>
              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                <MapPin size={10} />{inf.city}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="font-bold text-gray-900">{inf.rating}</span>
              <span className="text-gray-400">({inf.reviews})</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900">{formatK(inf.followers)}</div>
              <div className="text-xs text-gray-400">Seguidores</div>
            </div>
            <div className="text-center border-x border-gray-100">
              <div className="text-sm font-bold text-emerald-600">{inf.er}%</div>
              <div className="text-xs text-gray-400">Engagement</div>
            </div>
            <div className="text-center">
              <div className={`text-sm font-bold text-gray-900 ${locked ? 'select-none' : ''}`}
                style={locked ? { filter: 'blur(4px)' } : {}}>
                {inf.priceMin}€
              </div>
              <div className="text-xs text-gray-400">Desde</div>
            </div>
          </div>

          {locked ? (
            <Button variant="secondary" size="sm" fullWidth onClick={() => setShowModal(true)}>
              <Lock size={13} /> Desbloquear perfil
            </Button>
          ) : (
            <Button variant={featured ? 'primary' : 'outline'} size="sm" fullWidth>
              <MessageCircle size={13} /> Contactar
            </Button>
          )}
        </div>
      </div>

      {showModal && (
        <UnlockModal
          inf={inf}
          onClose={() => setShowModal(false)}
          onUnlocked={onUnlock}
          credits={credits}
          unlocking={unlocking}
        />
      )}
    </>
  );
}

/* ─── COLLAB CARD ──────────────────────────────────────────────────── */
function CollabCard({ c }: { c: typeof COLLABS[0] }) {
  return (
    <div className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer ${c.boosted ? 'border-violet-300 ring-2 ring-violet-100 shadow-md' : 'border-gray-100 shadow-sm'}`}>
      {/* Cover */}
      <div className="relative h-36 sm:h-40 overflow-hidden bg-gray-100">
        <img
          src={c.cover}
          alt={c.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Badges top */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {c.boosted && (
            <span className="flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              <Flame size={10} fill="white" /> Destacado
            </span>
          )}
        </div>

        {/* Budget top right */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-md ${c.type === 'Pago' ? 'bg-emerald-500 text-white' : c.type === 'Canje' ? 'bg-amber-500 text-white' : 'bg-violet-600 text-white'}`}>
            {c.type}{c.budget ? ` · ${c.budget}€` : ''}
          </span>
        </div>

        {/* Brand info bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
          <Avatar name={c.brand} size="sm" className="border-2 border-white shadow" />
          <div>
            <div className="text-xs font-bold text-white">{c.brand}</div>
            <div className="flex items-center gap-1 text-xs text-white/70">
              <MapPin size={9} />{c.city}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="text-sm font-semibold text-gray-900 leading-snug mb-2 line-clamp-2">
          {c.title}
        </div>
        <p className="text-xs text-gray-400 line-clamp-1 mb-3">{c.description}</p>

        <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Users size={11} />{c.applicants} solicitudes</span>
          <span>Hasta {c.deadline}</span>
        </div>

        <Button variant="primary" size="sm" fullWidth>
          Aplicar ahora
        </Button>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ────────────────────────────────────────────────────── */
export default function DiscoverPage() {
  const [tab, setTab] = useState<'influencers' | 'collabs'>('influencers');
  const [niche, setNiche] = useState('Todos');
  const [city, setCity] = useState('Todas');
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { credits, loading: unlocking, unlock, persistedUnlocked } = useCredits(MOCK_USER_ID);

  // persistedUnlocked viene del hook (cargado desde Supabase al montar + actualizado al desbloquear)
  // isUnlocked recibe string IDs — compara como string para evitar type mismatch
  const isUnlocked = (infId: number) => persistedUnlocked.has(String(infId));

  const handleUnlock = async (id: string) => {
    const result = await unlock(id);
    return result ?? { success: false };
  };

  const filteredInfluencers = INFLUENCERS.filter(i => {
    const matchNiche = niche === 'Todos' || i.niche === niche;
    const matchCity = city === 'Todas' || i.city === city;
    const matchQ = !query || i.name.toLowerCase().includes(query.toLowerCase()) || i.handle.includes(query.toLowerCase());
    return matchNiche && matchCity && matchQ;
  });

  const featured = filteredInfluencers.filter(i => i.featured);
  const rest = filteredInfluencers.filter(i => !i.featured);

  const filteredCollabs = COLLABS.filter(c => {
    const matchNiche = niche === 'Todos' || c.niche === niche;
    const matchCity = city === 'Todas' || c.city === city || c.city === 'Remoto';
    const matchQ = !query || c.title.toLowerCase().includes(query.toLowerCase()) || c.brand.toLowerCase().includes(query.toLowerCase());
    return matchNiche && matchCity && matchQ;
  });

  const featuredCollabs = filteredCollabs.filter(c => c.boosted);
  const restCollabs = filteredCollabs.filter(c => !c.boosted);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-16">
        {/* ── Sticky search bar ── */}
        <div className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">

            {/* Tab selector + search */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex rounded-xl bg-gray-100 p-0.5 gap-0.5 flex-shrink-0">
                <button
                  onClick={() => setTab('influencers')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${tab === 'influencers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Users size={13} /> Creadores
                </button>
                <button
                  onClick={() => setTab('collabs')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${tab === 'collabs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <TrendingUp size={13} /> Colaboraciones
                </button>
              </div>

              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={tab === 'influencers' ? 'Nombre, @handle, nicho...' : 'Marca o tipo de collab...'}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-shrink-0 p-2.5 rounded-xl border transition-colors ${showFilters ? 'bg-violet-50 border-violet-300 text-violet-700' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'}`}
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>

            {/* Filter panel */}
            {showFilters ? (
              <div className="flex flex-wrap gap-4 py-2">
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Nicho</div>
                  <div className="flex flex-wrap gap-1.5">
                    {NICHES.map(n => (
                      <button key={n} onClick={() => setNiche(n)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${niche === n ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 bg-white hover:border-violet-300'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Ciudad</div>
                  <div className="flex flex-wrap gap-1.5">
                    {CITIES.map(c => (
                      <button key={c} onClick={() => setCity(c)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${city === c ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 bg-white hover:border-violet-300'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Niche pills scroll */
              <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                {NICHES.map(n => (
                  <button key={n} onClick={() => setNiche(n)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${niche === n ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 bg-white hover:border-violet-300'}`}>
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

          {tab === 'influencers' ? (
            <div>
              {/* Destacados */}
              {featured.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Zap size={16} className="text-violet-600" />
                      Creadores destacados
                      <Badge variant="primary" size="sm">{featured.length}</Badge>
                    </h2>
                    <button className="text-xs text-violet-600 font-semibold flex items-center gap-1 hover:text-violet-700">
                      Ver todos <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {featured.map(inf => (
                      <InfluencerCard key={inf.id} inf={inf} featured credits={credits} unlocking={unlocking} onUnlock={handleUnlock} isUnlocked={isUnlocked(inf.id)} />
                    ))}
                  </div>
                </section>
              )}

              {/* Todos los demás */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">
                    {niche !== 'Todos' ? niche : 'Todos los creadores'}
                    <span className="text-gray-400 font-normal text-sm ml-2">{filteredInfluencers.length} perfiles</span>
                  </h2>
                </div>

                {/* Credits banner */}
                {rest.some(i => i.free) && (
                  <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-5">
                    <Lock size={18} className="text-violet-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">Algunos perfiles están bloqueados</div>
                      <div className="text-xs text-gray-500">Consigue créditos para acceder a todos los contactos sin límite</div>
                    </div>
                    <Button variant="secondary" size="sm" className="flex-shrink-0">
                      Ver planes
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {rest.map(inf => (
                    <InfluencerCard key={inf.id} inf={inf} credits={credits} unlocking={unlocking} onUnlock={handleUnlock} isUnlocked={isUnlocked(inf.id)} />
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div>
              {/* Colaboraciones destacadas */}
              {featuredCollabs.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Flame size={16} className="text-orange-500" />
                      Colaboraciones destacadas
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredCollabs.map(c => <CollabCard key={c.id} c={c} />)}
                  </div>
                </section>
              )}

              {/* Resto */}
              <section>
                <h2 className="text-base font-bold text-gray-900 mb-4">
                  Todas las colaboraciones
                  <span className="text-gray-400 font-normal text-sm ml-2">{filteredCollabs.length} abiertas</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restCollabs.map(c => <CollabCard key={c.id} c={c} />)}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
