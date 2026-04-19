'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useCredits } from '@/lib/hooks/useCredits';
import { useAuth } from '@/components/AuthProvider';
import { applyToCollaboration, checkPlanLimit, getPublicCollaborations, type PublicCollaboration } from '@/lib/supabase';
import PlanLimitModal from '@/components/PlanLimitModal';
import { useRouter } from 'next/navigation';
import {
  Search, SlidersHorizontal, Star, Shield, Zap, MapPin,
  Users, TrendingUp, Lock, MessageCircle, ChevronRight, Flame,
  Send, CheckCircle, Video, Camera, Film,
} from 'lucide-react';

/* ─── MOCK DATA — INFLUENCERS ──────────────────────────────────────────── */
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

/* ─── MOCK DATA — UGC CREATORS ─────────────────────────────────────────── */
const UGC_CREATORS = [
  {
    id: 201, name: 'Claudia Moreno', handle: '@claudiavisual', niche: 'Lifestyle', city: 'Madrid',
    content_types: ['video', 'reel', 'foto'],
    price_video: 180, price_photo: 90,
    verified: true, rating: 4.9, reviews: 31, available: true, featured: true,
    img: 'https://picsum.photos/seed/claudia-m/400/500',
    portfolio: Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/ugc-cl${i}/300/300`),
  },
  {
    id: 202, name: 'David Soria', handle: '@davidcreates', niche: 'Gastronomía', city: 'Sevilla',
    content_types: ['video', 'foto', 'carrusel'],
    price_video: 150, price_photo: 70,
    verified: true, rating: 5.0, reviews: 24, available: true, featured: true,
    img: 'https://picsum.photos/seed/david-s/400/500',
    portfolio: Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/ugc-dv${i}/300/300`),
  },
  {
    id: 203, name: 'Nuria Blanco', handle: '@nuriacontent', niche: 'Belleza', city: 'Barcelona',
    content_types: ['reel', 'story', 'foto'],
    price_video: 200, price_photo: 100,
    verified: false, rating: 4.7, reviews: 19, available: true, featured: false,
    img: 'https://picsum.photos/seed/nuria-b/400/500',
    portfolio: Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/ugc-nu${i}/300/300`),
  },
  {
    id: 204, name: 'Tomás Gil', handle: '@tomasgil', niche: 'Fitness', city: 'Madrid',
    content_types: ['video', 'reel'],
    price_video: 220, price_photo: 110,
    verified: true, rating: 4.8, reviews: 42, available: false, featured: false,
    img: 'https://picsum.photos/seed/tomas-g/400/500',
    portfolio: Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/ugc-tg${i}/300/300`),
  },
  {
    id: 205, name: 'Irene Vidal', handle: '@irenelifestyle', niche: 'Moda', city: 'Valencia',
    content_types: ['video', 'foto', 'carrusel', 'reel'],
    price_video: 160, price_photo: 80,
    verified: true, rating: 4.6, reviews: 11, available: true, featured: false,
    img: 'https://picsum.photos/seed/irene-v/400/500',
    portfolio: Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/ugc-ir${i}/300/300`),
  },
  {
    id: 206, name: 'Marcos Fuentes', handle: '@marcosfilm', niche: 'Tecnología', city: 'Bilbao',
    content_types: ['video', 'reel'],
    price_video: 250, price_photo: 120,
    verified: true, rating: 4.9, reviews: 38, available: true, featured: false,
    img: 'https://picsum.photos/seed/marcos-f/400/500',
    portfolio: Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/ugc-mf${i}/300/300`),
  },
];

/* ─── COLABORACIONES — AHORA DATOS REALES DESDE SUPABASE ──────────────── */

const COLLAB_TYPE_LABELS: Record<string, string> = {
  canje: 'Canje',
  pago: 'Pago',
  mixto: 'Canje + Pago',
};

function collabBudgetLabel(c: PublicCollaboration): string {
  if (c.collab_type === 'canje') return 'Canje';
  if (!c.budget_min && !c.budget_max) return 'A convenir';
  if (c.budget_min && c.budget_max && c.budget_min === c.budget_max) return `${c.budget_min}€`;
  if (c.budget_min && c.budget_max) return `${c.budget_min}-${c.budget_max}€`;
  return `${c.budget_min ?? c.budget_max}€`;
}

function fmtDeadline(d: string | null): string {
  if (!d) return 'sin fecha';
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function collabCoverSeed(id: string): string {
  return `https://picsum.photos/seed/collab-${id.slice(0, 8)}/600/400`;
}

const NICHES = ['Todos', 'Gastronomía', 'Moda', 'Fitness', 'Viajes', 'Bienestar', 'Tecnología', 'Belleza'];
const CITIES = ['Todas', 'Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Málaga'];

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  video:    <Video size={11} />,
  reel:     <Film size={11} />,
  foto:     <Camera size={11} />,
  carrusel: <Camera size={11} />,
  story:    <Film size={11} />,
};

function formatK(n: number) {
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);
}

/* ─── UNLOCK MODAL ─────────────────────────────────────────────────────── */
function UnlockModal({
  inf, onClose, onUnlocked, credits, unlocking,
}: {
  inf: typeof INFLUENCERS[0];
  onClose: () => void;
  onUnlocked: (id: string) => Promise<{ success: boolean; error_code?: string; credits_remaining?: number }>;
  credits: number | null;
  unlocking: boolean;
}) {
  const [result, setResult] = useState<'idle' | 'ok' | 'no_credits'>('idle');

  const handleUnlock = async () => {
    const res = await onUnlocked(String(inf.id));
    if (res?.success) setResult('ok');
    else if (res?.error_code === 'insufficient_credits') setResult('no_credits');
  };

  const hasCredits = credits !== null && credits >= 10;
  const isOk = result === 'ok';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="relative h-44 overflow-hidden">
          <img src={inf.cover} alt="" className={`w-full h-full object-cover transition-all duration-500 ${isOk ? 'scale-100' : 'scale-110 blur-sm'}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <img src={inf.img} alt="" className={`w-12 h-12 rounded-full border-2 border-white object-cover transition-all duration-500 ${isOk ? '' : 'blur-sm'}`} />
            <div>
              <div className="text-white font-bold text-sm transition-all duration-500" style={isOk ? {} : { filter: 'blur(5px)' }}>{inf.name}</div>
              <div className="text-white/80 text-xs transition-all duration-500" style={isOk ? {} : { filter: 'blur(4px)' }}>{inf.handle}</div>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors text-lg leading-none">×</button>
        </div>
        <div className="p-5">
          {isOk ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-base">🎉</div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">¡Perfil desbloqueado!</div>
                  <div className="text-xs text-gray-400">Ahora tienes acceso completo</div>
                </div>
              </div>
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                  <span className="text-base">📧</span>
                  <div><div className="text-xs text-gray-400">Email</div><div className="text-sm font-semibold text-gray-900">{inf.email}</div></div>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                  <span className="text-base">📱</span>
                  <div><div className="text-xs text-gray-400">Teléfono</div><div className="text-sm font-semibold text-gray-900">{inf.phone}</div></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-violet-50 rounded-xl text-center">
                    <div className="text-sm font-bold text-violet-700">{inf.priceMin}€ – {inf.priceMax}€</div>
                    <div className="text-xs text-gray-400">Tarifa</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-center">
                    <div className="text-sm font-bold text-emerald-600">{inf.er}% ER</div>
                    <div className="text-xs text-gray-400">{formatK(inf.followers)} seg.</div>
                  </div>
                </div>
              </div>
              <Button fullWidth size="md" onClick={onClose}><MessageCircle size={15} /> Ver perfil</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2"><Lock size={16} className="text-violet-600" /><span className="font-bold text-gray-900 text-base">Perfil bloqueado</span></div>
                {credits !== null && (
                  <div className="flex items-center gap-1 bg-violet-50 text-violet-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    <Zap size={11} /> {credits} créditos
                  </div>
                )}
              </div>
              <p className="text-gray-500 text-sm mb-4">Desbloquea para ver nombre, email, teléfono y tarifa exacta.</p>
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
                <Button fullWidth size="md" loading={unlocking} onClick={handleUnlock} disabled={!hasCredits}><Zap size={15} /> Desbloquear · 10 créditos</Button>
                <Button fullWidth size="md" variant="outline">Ver planes de suscripción</Button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">Con el plan Starter tienes acceso ilimitado</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── INFLUENCER CARD ──────────────────────────────────────────────────── */
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
        <div className="relative h-44 sm:h-48 overflow-hidden bg-gray-100">
          <img src={inf.cover} alt={inf.niche} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            {featured && <span className="flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg"><Zap size={10} fill="white" /> Destacado</span>}
            {inf.verified && <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-violet-700 text-xs font-bold px-2 py-1 rounded-full"><Shield size={10} /> Pro</span>}
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            {locked ? (
              <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.25)' }}>
                <img src={inf.img} alt="" className="w-8 h-8 rounded-full border border-white/50 object-cover flex-shrink-0" style={{ filter: 'blur(6px)' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white leading-tight truncate select-none" style={{ filter: 'blur(5px)', userSelect: 'none' }}>{inf.name}</div>
                  <div className="text-xs text-white/80 truncate select-none" style={{ filter: 'blur(4px)', userSelect: 'none' }}>{inf.handle}</div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1"><Lock size={11} className="text-white" /><span className="text-white text-xs font-semibold">Ver</span></div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3 pb-3">
                <img src={inf.img} alt={inf.name} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-md" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white leading-tight truncate">{inf.name}</div>
                  <div className="text-xs text-white/80 truncate">{inf.handle}</div>
                </div>
                {inf.available && <span className="text-xs bg-emerald-500 text-white font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Libre</span>}
              </div>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Badge variant="default" size="sm">{inf.niche}</Badge>
              <span className="flex items-center gap-0.5 text-xs text-gray-400"><MapPin size={10} />{inf.city}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="font-bold text-gray-900">{inf.rating}</span>
              <span className="text-gray-400">({inf.reviews})</span>
            </div>
          </div>
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
              <div className={`text-sm font-bold text-gray-900 ${locked ? 'select-none' : ''}`} style={locked ? { filter: 'blur(4px)' } : {}}>{inf.priceMin}€</div>
              <div className="text-xs text-gray-400">Desde</div>
            </div>
          </div>
          {locked ? (
            <Button variant="secondary" size="sm" fullWidth onClick={() => setShowModal(true)}><Lock size={13} /> Desbloquear perfil</Button>
          ) : (
            <Button variant={featured ? 'primary' : 'outline'} size="sm" fullWidth><MessageCircle size={13} /> Contactar</Button>
          )}
        </div>
      </div>
      {showModal && <UnlockModal inf={inf} onClose={() => setShowModal(false)} onUnlocked={onUnlock} credits={credits} unlocking={unlocking} />}
    </>
  );
}

/* ─── UGC CREATOR CARD ─────────────────────────────────────────────────── */
function UgcCreatorCard({
  creator, featured, userType, userId,
}: {
  creator: typeof UGC_CREATORS[0];
  featured?: boolean;
  userType: string | null;
  userId: string | null;
}) {
  const router = useRouter();

  const handleContact = () => {
    if (!userId) { router.push('/login'); return; }
    if (userType === 'brand') router.push('/dashboard/brand/ugc/new');
  };

  return (
    <div className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${featured ? 'border-violet-300 ring-2 ring-violet-100 shadow-md' : 'border-gray-100 shadow-sm'}`}>
      {/* Portfolio grid 3 fotos */}
      <div className="relative h-40 grid grid-cols-3 gap-0.5 overflow-hidden bg-gray-100">
        {creator.portfolio.map((src, i) => (
          <div key={i} className={`overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`} style={i === 0 ? { gridRow: 'span 2' } : {}}>
            <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* UGC badge */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className="flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            <Video size={10} fill="white" /> UGC
          </span>
          {featured && <span className="flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full"><Zap size={10} fill="white" /> Top</span>}
        </div>

        {/* Creator info */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2.5 px-3 pb-3">
          <img src={creator.img} alt={creator.name} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-md" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white leading-tight truncate">{creator.name}</div>
            <div className="text-xs text-white/80 truncate">{creator.handle}</div>
          </div>
          {creator.available
            ? <span className="text-xs bg-emerald-500 text-white font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Libre</span>
            : <span className="text-xs bg-gray-500/80 text-white font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Ocupado</span>
          }
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Badge variant="default" size="sm">{creator.niche}</Badge>
            <span className="flex items-center gap-0.5 text-xs text-gray-400"><MapPin size={10} />{creator.city}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="font-bold text-gray-900">{creator.rating}</span>
            <span className="text-gray-400">({creator.reviews})</span>
          </div>
        </div>

        {/* Content types */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {creator.content_types.map(ct => (
            <span key={ct} className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
              {CONTENT_TYPE_ICONS[ct]} {ct}
            </span>
          ))}
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <div className="text-sm font-bold text-gray-900">{creator.price_video}€</div>
            <div className="text-xs text-gray-400">por vídeo</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <div className="text-sm font-bold text-gray-900">{creator.price_photo}€</div>
            <div className="text-xs text-gray-400">por foto</div>
          </div>
        </div>

        <Button
          variant={featured ? 'primary' : 'outline'}
          size="sm"
          fullWidth
          onClick={handleContact}
          disabled={!creator.available}
        >
          {!userId ? 'Entra para contactar' : userType === 'brand' ? 'Enviar briefing' : 'Ver perfil'}
        </Button>
      </div>
    </div>
  );
}

/* ─── APPLY MODAL ──────────────────────────────────────────────────────── */
function ApplyModal({ collab, userId, onClose, onApplied }: { collab: PublicCollaboration; userId: string; onClose: () => void; onApplied: () => void }) {
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const brandName = collab.brand?.brand_name ?? 'Marca';
  const typeLabel = COLLAB_TYPE_LABELS[collab.collab_type] ?? collab.collab_type;
  const budgetStr = collabBudgetLabel(collab);

  const handleApply = async () => {
    setState('loading');
    const result = await applyToCollaboration(userId, collab.id, message || undefined);
    if (result.success) {
      setState('ok');
      setTimeout(() => { onApplied(); onClose(); }, 1400);
    } else {
      setState('error');
      setErrorMsg(
        result.error_code === 'already_applied' ? 'Ya has aplicado a esta colaboración' :
        result.error_code === 'collab_not_found' ? 'Colaboración no disponible' :
        result.error_code === 'creator_profile_not_found' ? 'Tu perfil de creador no está configurado aún' :
        'No se pudo enviar la solicitud. Inténtalo de nuevo.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="relative h-36 overflow-hidden">
          <img src={collabCoverSeed(collab.id)} alt="" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-4">
            <div className="text-white font-bold text-sm">{brandName}</div>
            <div className="text-white/70 text-xs">{collab.city ?? '—'}</div>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors text-lg leading-none">×</button>
        </div>
        <div className="p-5">
          {state === 'ok' ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">🎉</div>
              <div className="font-bold text-gray-900 mb-1">¡Solicitud enviada!</div>
              <div className="text-sm text-gray-500">La marca revisará tu perfil en breve</div>
            </div>
          ) : (
            <>
              <div className="mb-1">
                <div className="font-bold text-gray-900 text-base leading-snug">{collab.title}</div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span className={`font-semibold px-2 py-0.5 rounded-full ${collab.collab_type === 'pago' ? 'bg-emerald-100 text-emerald-700' : collab.collab_type === 'canje' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'}`}>
                    {typeLabel}{collab.collab_type !== 'canje' && budgetStr !== 'A convenir' ? ` · ${budgetStr}` : ''}
                  </span>
                  <span>Hasta {fmtDeadline(collab.deadline)}</span>
                </div>
              </div>
              <div className="my-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mensaje para la marca <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Cuéntales por qué encajas con esta colaboración…" rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
              </div>
              {state === 'error' && <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600 mb-3">{errorMsg}</div>}
              <Button fullWidth size="md" loading={state === 'loading'} onClick={handleApply}><Send size={15} /> Enviar solicitud</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── COLLAB CARD ──────────────────────────────────────────────────────── */
function CollabCard({ c, userId, userType }: { c: PublicCollaboration; userId: string | null; userType: string | null }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(false);
  const [gate, setGate] = useState<{ current?: number; limit?: number; upgradeTo: 'starter' | 'pro' } | null>(null);

  const handleApplyClick = async () => {
    if (!userId) { router.push('/login'); return; }
    if (userType === 'brand') return;

    // Verificar límite de aplicaciones del mes
    const check = await checkPlanLimit(userId, 'apply_to_collab');
    if (!check.allowed && check.reason === 'max_applications_month_reached') {
      setGate({
        current: check.current,
        limit: check.limit,
        upgradeTo: (check.upgrade_to ?? 'starter') as 'starter' | 'pro',
      });
      return;
    }

    setShowModal(true);
  };

  const isBrand = userType === 'brand';
  const brandName = c.brand?.brand_name ?? 'Marca';
  const typeLabel = COLLAB_TYPE_LABELS[c.collab_type] ?? c.collab_type;
  const budgetStr = collabBudgetLabel(c);

  return (
    <>
      <div className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer ${c.is_boosted ? 'border-violet-300 ring-2 ring-violet-100 shadow-md' : 'border-gray-100 shadow-sm'}`}>
        <div className="relative h-36 sm:h-40 overflow-hidden bg-gray-100">
          <img src={c.brand?.logo_url ?? collabCoverSeed(c.id)} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            {c.is_boosted && <span className="flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg"><Flame size={10} fill="white" /> Destacado</span>}
          </div>
          <div className="absolute top-3 right-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-md ${c.collab_type === 'pago' ? 'bg-emerald-500 text-white' : c.collab_type === 'canje' ? 'bg-amber-500 text-white' : 'bg-violet-600 text-white'}`}>
              {typeLabel}{c.collab_type !== 'canje' && budgetStr !== 'A convenir' ? ` · ${budgetStr}` : ''}
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            <Avatar name={brandName} size="sm" className="border-2 border-white shadow" />
            <div>
              <div className="text-xs font-bold text-white">{brandName}</div>
              <div className="flex items-center gap-1 text-xs text-white/70"><MapPin size={9} />{c.city ?? '—'}</div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="text-sm font-semibold text-gray-900 leading-snug mb-2 line-clamp-2">{c.title}</div>
          {c.description && <p className="text-xs text-gray-400 line-clamp-1 mb-3">{c.description}</p>}
          <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Users size={11} />{c.niches_required?.[0] ?? '—'}</span>
            <span>Hasta {fmtDeadline(c.deadline)}</span>
          </div>
          {applied ? (
            <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold"><CheckCircle size={13} /> Solicitud enviada</div>
          ) : isBrand ? (
            <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 text-gray-400 text-xs font-medium cursor-not-allowed">Solo para creadores</div>
          ) : (
            <Button variant="primary" size="sm" fullWidth onClick={handleApplyClick}>{!userId ? 'Entra para aplicar' : 'Aplicar ahora'}</Button>
          )}
        </div>
      </div>
      {showModal && userId && <ApplyModal collab={c} userId={userId} onClose={() => setShowModal(false)} onApplied={() => setApplied(true)} />}
      {gate && userId && (
        <PlanLimitModal
          open={true}
          onClose={() => setGate(null)}
          userId={userId}
          role="influencer"
          reason="max_applications_month_reached"
          current={gate.current}
          limit={gate.limit}
          upgradeTo={gate.upgradeTo}
        />
      )}
    </>
  );
}

/* ─── MAIN PAGE ────────────────────────────────────────────────────────── */
export default function DiscoverPage() {
  const [tab, setTab] = useState<'influencers' | 'collabs'>('influencers');
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'influencer' | 'ugc'>('all');
  const [niche, setNiche] = useState('Todos');
  const [city, setCity] = useState('Todas');
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const userType = (user?.user_metadata?.user_type as string | undefined) ?? null;
  const { credits, loading: unlocking, unlock, persistedUnlocked } = useCredits(user?.id ?? null);

  // Colaboraciones reales desde Supabase
  const [collabs, setCollabs] = useState<PublicCollaboration[]>([]);
  const [loadingCollabs, setLoadingCollabs] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingCollabs(true);
    getPublicCollaborations()
      .then(data => { if (!cancelled) setCollabs(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoadingCollabs(false); });
    return () => { cancelled = true; };
  }, []);

  const isUnlocked = (infId: number) => persistedUnlocked.has(String(infId));

  const handleUnlock = async (id: string) => {
    const result = await unlock(id);
    return result ?? { success: false };
  };

  // Filtered influencers
  const filteredInfluencers = INFLUENCERS.filter(i => {
    const matchNiche = niche === 'Todos' || i.niche === niche;
    const matchCity = city === 'Todas' || i.city === city;
    const matchQ = !query || i.name.toLowerCase().includes(query.toLowerCase()) || i.handle.includes(query.toLowerCase());
    return matchNiche && matchCity && matchQ;
  });

  // Filtered UGC creators
  const filteredUgc = UGC_CREATORS.filter(c => {
    const matchNiche = niche === 'Todos' || c.niche === niche;
    const matchCity = city === 'Todas' || c.city === city;
    const matchQ = !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.handle.includes(query.toLowerCase());
    return matchNiche && matchCity && matchQ;
  });

  const filteredCollabs = collabs.filter(c => {
    const matchNiche = niche === 'Todos' || c.niches_required?.includes(niche);
    const matchCity = city === 'Todas' || c.city === city || !c.city;
    const matchQ = !query
      || c.title.toLowerCase().includes(query.toLowerCase())
      || (c.brand?.brand_name?.toLowerCase().includes(query.toLowerCase()) ?? false);
    return matchNiche && matchCity && matchQ;
  });

  const showInfluencers = creatorFilter === 'all' || creatorFilter === 'influencer';
  const showUgc = creatorFilter === 'all' || creatorFilter === 'ugc';
  const featuredInfluencers = showInfluencers ? filteredInfluencers.filter(i => i.featured) : [];
  const restInfluencers = showInfluencers ? filteredInfluencers.filter(i => !i.featured) : [];
  const featuredUgc = showUgc ? filteredUgc.filter(c => c.featured) : [];
  const restUgc = showUgc ? filteredUgc.filter(c => !c.featured) : [];

  const totalCount = (showInfluencers ? filteredInfluencers.length : 0) + (showUgc ? filteredUgc.length : 0);

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

            {/* Creator type sub-filter (solo en tab creadores) */}
            {tab === 'influencers' && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex rounded-xl bg-gray-100 p-0.5 gap-0.5">
                  {(['all', 'influencer', 'ugc'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setCreatorFilter(f)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${creatorFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {f === 'all' && 'Todos'}
                      {f === 'influencer' && <><Users size={11} /> Influencers</>}
                      {f === 'ugc' && <><Video size={11} /> UGC</>}
                    </button>
                  ))}
                </div>
                {creatorFilter === 'ugc' && (
                  <span className="text-xs text-gray-400">Creadores de contenido sin audiencia — solo el vídeo/foto para tu marca</span>
                )}
              </div>
            )}

            {/* Filter panel */}
            {showFilters ? (
              <div className="flex flex-wrap gap-4 py-2">
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Nicho</div>
                  <div className="flex flex-wrap gap-1.5">
                    {NICHES.map(n => (
                      <button key={n} onClick={() => setNiche(n)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${niche === n ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 bg-white hover:border-violet-300'}`}>{n}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Ciudad</div>
                  <div className="flex flex-wrap gap-1.5">
                    {CITIES.map(c => (
                      <button key={c} onClick={() => setCity(c)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${city === c ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 bg-white hover:border-violet-300'}`}>{c}</button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                {NICHES.map(n => (
                  <button key={n} onClick={() => setNiche(n)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${niche === n ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 bg-white hover:border-violet-300'}`}>{n}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

          {tab === 'influencers' ? (
            <div className="space-y-10">

              {/* Banner UGC info si está en filtro ugc */}
              {creatorFilter === 'ugc' && (
                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 text-xl">🎬</div>
                  <div>
                    <div className="text-sm font-bold text-violet-900 mb-0.5">¿Qué es UGC?</div>
                    <div className="text-xs text-violet-700">
                      Los creadores UGC producen contenido de calidad profesional para que <strong>tú lo publiques</strong> en tus canales. No necesitas su audiencia — solo su talento creativo. Ideal para anuncios, redes sociales y web.
                    </div>
                  </div>
                </div>
              )}

              {/* Destacados */}
              {(featuredInfluencers.length > 0 || featuredUgc.length > 0) && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Zap size={16} className="text-violet-600" />
                      Destacados
                      <Badge variant="primary" size="sm">{featuredInfluencers.length + featuredUgc.length}</Badge>
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {featuredInfluencers.map(inf => (
                      <InfluencerCard key={`inf-${inf.id}`} inf={inf} featured credits={credits} unlocking={unlocking} onUnlock={handleUnlock} isUnlocked={isUnlocked(inf.id)} />
                    ))}
                    {featuredUgc.map(c => (
                      <UgcCreatorCard key={`ugc-${c.id}`} creator={c} featured userType={userType} userId={user?.id ?? null} />
                    ))}
                  </div>
                </section>
              )}

              {/* Grid principal */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">
                    {creatorFilter === 'ugc' ? 'Creadores UGC' : creatorFilter === 'influencer' ? 'Influencers' : niche !== 'Todos' ? niche : 'Todos los creadores'}
                    <span className="text-gray-400 font-normal text-sm ml-2">{totalCount} perfiles</span>
                  </h2>
                </div>

                {restInfluencers.some(i => i.free) && showInfluencers && (
                  <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-5">
                    <Lock size={18} className="text-violet-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">Algunos perfiles están bloqueados</div>
                      <div className="text-xs text-gray-500">Consigue créditos para acceder a todos los contactos sin límite</div>
                    </div>
                    <Button variant="secondary" size="sm" className="flex-shrink-0">Ver planes</Button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {restInfluencers.map(inf => (
                    <InfluencerCard key={`inf-${inf.id}`} inf={inf} credits={credits} unlocking={unlocking} onUnlock={handleUnlock} isUnlocked={isUnlocked(inf.id)} />
                  ))}
                  {restUgc.map(c => (
                    <UgcCreatorCard key={`ugc-${c.id}`} creator={c} userType={userType} userId={user?.id ?? null} />
                  ))}
                </div>

                {totalCount === 0 && (
                  <div className="text-center py-16">
                    <div className="text-3xl mb-3">🔍</div>
                    <div className="text-sm font-semibold text-gray-700">Sin resultados</div>
                    <div className="text-xs text-gray-400 mt-1">Prueba con otros filtros</div>
                  </div>
                )}
              </section>
            </div>
          ) : loadingCollabs ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <div className="text-sm text-gray-500">Cargando colaboraciones...</div>
            </div>
          ) : filteredCollabs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-3xl mb-3">📭</div>
              <div className="text-sm font-semibold text-gray-700">No hay colaboraciones abiertas</div>
              <div className="text-xs text-gray-400 mt-1">Prueba con otros filtros o vuelve pronto</div>
            </div>
          ) : (
            <div>
              {filteredCollabs.filter(c => c.is_boosted).length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><Flame size={16} className="text-orange-500" /> Colaboraciones destacadas</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCollabs.filter(c => c.is_boosted).map(c => <CollabCard key={c.id} c={c} userId={user?.id ?? null} userType={userType} />)}
                  </div>
                </section>
              )}
              <section>
                <h2 className="text-base font-bold text-gray-900 mb-4">
                  Todas las colaboraciones
                  <span className="text-gray-400 font-normal text-sm ml-2">{filteredCollabs.length} abiertas</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCollabs.filter(c => !c.is_boosted).map(c => <CollabCard key={c.id} c={c} userId={user?.id ?? null} userType={userType} />)}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
