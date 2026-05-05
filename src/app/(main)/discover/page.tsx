'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useCredits } from '@/lib/hooks/useCredits';
import { useAuth } from '@/components/AuthProvider';
import {
  applyToCollaboration, checkPlanLimit,
  getPublicCollaborations, getPublicInfluencers, getPublicUgcCreators,
  getOrCreateDirectConversation,
  type PublicCollaboration, type PublicInfluencerProfile,
} from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import PlanLimitModal from '@/components/PlanLimitModal';
import CreatorDrawer from '@/components/CreatorDrawer';
import { useRouter } from 'next/navigation';
import {
  Search, SlidersHorizontal, Star, Shield, Zap, MapPin,
  Users, TrendingUp, Lock, MessageCircle, ChevronRight, Flame,
  Send, CheckCircle, Video, Camera, Film, ExternalLink,
} from 'lucide-react';

/* ─── HELPERS ──────────────────────────────────────────────────────────────── */

function imgSeed(p: PublicInfluencerProfile): string {
  const seed = p.instagram_handle ?? p.id.slice(0, 8);
  return p.avatar_url ?? `https://picsum.photos/seed/av-${seed}/400/500`;
}

function coverSeed(p: PublicInfluencerProfile): string {
  const seed = p.instagram_handle ?? p.id.slice(0, 8);
  const niche = p.niches?.[0] ?? 'lifestyle';
  return `https://picsum.photos/seed/${niche}-${seed}/600/400`;
}

function primaryNiche(p: PublicInfluencerProfile): string {
  return p.niches?.[0] ?? 'Lifestyle';
}

function displayHandle(p: PublicInfluencerProfile): string {
  return p.instagram_handle ? `@${p.instagram_handle}` : `@${p.display_name.toLowerCase().replace(/\s+/g, '')}`;
}

function isFeatured(p: PublicInfluencerProfile): boolean {
  return p.is_verified && p.rating_avg >= 4.8;
}

function isLocked(p: PublicInfluencerProfile): boolean {
  return !isFeatured(p);
}

function ugcContentTypes(p: PublicInfluencerProfile): string[] {
  if (p.creator_type === 'both') return ['video', 'reel', 'foto', 'carrusel'];
  const niche = primaryNiche(p);
  if (niche === 'Gastronomía') return ['video', 'foto', 'carrusel'];
  if (niche === 'Fitness') return ['video', 'reel'];
  if (niche === 'Belleza') return ['reel', 'story', 'foto'];
  if (niche === 'Tecnología') return ['video', 'reel'];
  return ['video', 'reel', 'foto'];
}

function ugcPortfolio(p: PublicInfluencerProfile): string[] {
  const seed = p.instagram_handle ?? p.id.slice(0, 8);
  return Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/ugc-${seed}-${i}/300/300`);
}

/* ─── COLABORACIONES ───────────────────────────────────────────────────────── */

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

/* ─── UNLOCK MODAL ─────────────────────────────────────────────────────────── */
function UnlockModal({
  inf, onClose, onUnlocked, unlocking, userId,
}: {
  inf: PublicInfluencerProfile;
  onClose: () => void;
  onUnlocked: (id: string) => Promise<{ success: boolean; error_code?: string; current?: number; limit?: number }>;
  unlocking: boolean;
  userId: string | null;
}) {
  const router = useRouter();
  const [result, setResult] = useState<'idle' | 'ok' | 'need_plan' | 'monthly_full'>('idle');
  const [limitInfo, setLimitInfo] = useState<{ current?: number; limit?: number } | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const handleUnlock = async () => {
    const res = await onUnlocked(inf.id);
    if (res?.success) {
      setResult('ok');
    } else if (res?.error_code === 'plan_limit_reached') {
      setResult('need_plan');
    } else if (res?.error_code === 'monthly_limit_reached') {
      setLimitInfo({ current: res.current, limit: res.limit });
      setResult('monthly_full');
    }
  };

  const handleOpenChat = async () => {
    if (!userId || !inf.user_id) return;
    setChatLoading(true);
    try {
      const conv = await getOrCreateDirectConversation(userId, inf.user_id);
      onClose();
      router.push(`/chat/direct/${conv.id}`);
    } catch {
      setChatLoading(false);
    }
  };

  const isOk = result === 'ok';
  const handle = displayHandle(inf);
  const er = inf.engagement_rate_ig ?? 4.0;
  const img = imgSeed(inf);
  const cover = coverSeed(inf);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="relative h-44 overflow-hidden">
          <img src={cover} alt="" className={`w-full h-full object-cover transition-all duration-500 ${isOk ? 'scale-100' : 'scale-110 blur-sm'}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <img src={img} alt="" className={`w-12 h-12 rounded-full border-2 border-white object-cover transition-all duration-500 ${isOk ? '' : 'blur-sm'}`} />
            <div>
              <div className="text-white font-bold text-sm transition-all duration-500" style={isOk ? {} : { filter: 'blur(5px)' }}>{inf.display_name}</div>
              <div className="text-white/80 text-xs transition-all duration-500" style={isOk ? {} : { filter: 'blur(4px)' }}>{handle}</div>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors text-lg leading-none">×</button>
        </div>
        <div className="p-5">
          {isOk ? (
            <div>
              {/* Header éxito */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-base">🎉</div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">¡Perfil desbloqueado!</div>
                  <div className="text-xs text-gray-400">Ahora tienes acceso completo</div>
                </div>
              </div>
              {/* Datos desbloqueados */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                  <span className="text-base">📸</span>
                  <div>
                    <div className="text-xs text-gray-400">Instagram</div>
                    <div className="text-sm font-semibold text-gray-900">{handle}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-violet-50 rounded-xl text-center">
                    <div className="text-sm font-bold text-violet-700">{inf.price_min ?? '—'}€ – {inf.price_max ?? '—'}€</div>
                    <div className="text-xs text-gray-400">Tarifa</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-center">
                    <div className="text-sm font-bold text-emerald-600">{er}% ER</div>
                    <div className="text-xs text-gray-400">{formatK(inf.followers_ig)} seg.</div>
                  </div>
                </div>
              </div>
              {/* CTAs post-desbloqueo */}
              <div className="flex flex-col gap-2">
                <Button fullWidth size="md" loading={chatLoading} onClick={handleOpenChat}>
                  <MessageCircle size={15} /> Iniciar chat directo
                </Button>
                <Button fullWidth size="md" variant="outline" onClick={() => { onClose(); router.push(`/creators/${inf.user_id}`); }}>
                  <ExternalLink size={14} /> Ver perfil completo
                </Button>
              </div>
            </div>
          ) : result === 'need_plan' ? (
            <div className="text-center py-2">
              <div className="text-3xl mb-3">🔒</div>
              <div className="font-bold text-gray-900 mb-1">Necesitas un plan de pago</div>
              <p className="text-sm text-gray-500 mb-5">Los perfiles bloqueados están disponibles desde el plan Starter. Accede a 15 perfiles al mes.</p>
              <div className="flex flex-col gap-2">
                <Button fullWidth size="md" onClick={() => { onClose(); router.push('/pricing'); }}><Zap size={15} /> Ver planes — desde 29€/mes</Button>
                <Button fullWidth size="md" variant="outline" onClick={onClose}>Ahora no</Button>
              </div>
            </div>
          ) : result === 'monthly_full' ? (
            <div className="text-center py-2">
              <div className="text-3xl mb-3">📊</div>
              <div className="font-bold text-gray-900 mb-1">Límite mensual alcanzado</div>
              <p className="text-sm text-gray-500 mb-2">
                Has desbloqueado {limitInfo?.current ?? limitInfo?.limit} de {limitInfo?.limit} perfiles este mes.
              </p>
              <p className="text-xs text-gray-400 mb-5">El contador se reinicia el 1 del próximo mes, o actualiza al plan Pro para acceso ilimitado.</p>
              <div className="flex flex-col gap-2">
                <Button fullWidth size="md" onClick={() => { onClose(); router.push('/pricing'); }}><Zap size={15} /> Actualizar a Pro</Button>
                <Button fullWidth size="md" variant="outline" onClick={onClose}>Esperar al mes siguiente</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Lock size={16} className="text-violet-600" />
                <span className="font-bold text-gray-900 text-base">Perfil bloqueado</span>
              </div>
              <p className="text-gray-500 text-sm mb-4">Desbloquea para ver el handle de Instagram, tarifa exacta y acceder al chat directo.</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{formatK(inf.followers_ig)}</div>
                  <div className="text-xs text-gray-400">Seguidores</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-emerald-600">{er}%</div>
                  <div className="text-xs text-gray-400">Engagement</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button fullWidth size="md" loading={unlocking} onClick={handleUnlock}>
                  <Lock size={15} /> Desbloquear y chatear
                </Button>
                <Button fullWidth size="md" variant="outline" onClick={() => { onClose(); router.push('/pricing'); }}>Ver planes de suscripción</Button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">Plan Starter: 15 perfiles/mes · Plan Pro: ilimitado</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── CONTACT MODAL (marca → creador) ─────────────────────────────────────── */
function ContactModal({
  creator, onClose,
}: {
  creator: PublicInfluencerProfile;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const handle = displayHandle(creator);

  const handleSubmit = async () => {
    setSending(true);
    try {
      const res = await authFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_user_id: creator.user_id, message: message.trim() || null }),
      });
      if (res.ok) setSent(true);
    } finally {
      setSending(false);
    }
  };
  const img = imgSeed(creator);
  const cover = coverSeed(creator);
  const niche = primaryNiche(creator);
  const er = creator.engagement_rate_ig ?? 4.0;
  const isUgc = creator.creator_type === 'ugc' || creator.creator_type === 'both';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative h-36 overflow-hidden">
          <img src={cover} alt="" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
            <img src={img} alt="" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow" />
            <div>
              <div className="text-white font-bold text-sm">{creator.display_name}</div>
              <div className="text-white/70 text-xs">{handle} · {niche}</div>
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
                {creator.display_name} recibirá tu mensaje y podrá aceptar la colaboración desde su panel.
              </div>
              <Button fullWidth size="md" onClick={onClose}><CheckCircle size={15} /> Entendido</Button>
            </div>
          ) : (
            <>
              {/* Stats rápidas */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <div className="text-sm font-bold text-gray-900">{formatK(creator.followers_ig)}</div>
                  <div className="text-xs text-gray-400">Seguidores</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                  <div className="text-sm font-bold text-emerald-600">{er}%</div>
                  <div className="text-xs text-gray-400">Engagement</div>
                </div>
                <div className="bg-violet-50 rounded-xl p-2.5 text-center">
                  <div className="text-sm font-bold text-violet-700">{creator.price_min ?? '—'}€</div>
                  <div className="text-xs text-gray-400">Desde</div>
                </div>
              </div>

              {/* Mensaje */}
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {isUgc ? 'Describe el contenido que necesitas' : 'Cuéntale sobre tu campaña'}
                <span className="text-gray-400 font-normal"> (opcional)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={isUgc
                  ? 'Producto, formato, plazos, requisitos especiales…'
                  : 'Tipo de colaboración, producto, fechas aproximadas…'}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none mb-4"
              />
              <Button fullWidth size="md" loading={sending} onClick={handleSubmit}>
                <Send size={15} /> Enviar solicitud
              </Button>
              <p className="text-center text-xs text-gray-400 mt-2">
                {creator.display_name} podrá aceptar desde su panel de Connectly
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── INFLUENCER CARD ──────────────────────────────────────────────────────── */
function InfluencerCard({
  inf, featured, locked, credits, unlocking, onUnlock, isUnlocked, userId, userType, onPreview,
}: {
  inf: PublicInfluencerProfile;
  featured?: boolean;
  locked?: boolean;
  credits: number | null;
  unlocking: boolean;
  onUnlock: (id: string) => Promise<{ success: boolean; error_code?: string; current?: number; limit?: number }>;
  isUnlocked: boolean;
  userId: string | null;
  userType: string | null;
  onPreview?: (inf: PublicInfluencerProfile) => void;
}) {
  const router = useRouter();
  const showLocked = (locked ?? isLocked(inf)) && !isUnlocked;
  const [showModal, setShowModal] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const handle = displayHandle(inf);
  const niche = primaryNiche(inf);
  const img = imgSeed(inf);
  const cover = coverSeed(inf);
  const er = inf.engagement_rate_ig ?? 4.0;

  const handleContactar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) { router.push('/login'); return; }
    setShowContact(true);
  };

  const handleCardClick = () => {
    if (onPreview) { onPreview(inf); return; }
    if (showLocked) setShowModal(true);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer ${featured ? 'border-violet-300 ring-2 ring-violet-100 shadow-md' : 'border-gray-100 shadow-sm'}`}
      >
        <div className="relative h-44 sm:h-48 overflow-hidden bg-gray-100">
          <img src={cover} alt={niche} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            {featured && <span className="flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg"><Zap size={10} fill="white" /> Destacado</span>}
            {inf.is_verified && <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-violet-700 text-xs font-bold px-2 py-1 rounded-full"><Shield size={10} /> Pro</span>}
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            {showLocked ? (
              <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.25)' }}>
                <img src={img} alt="" className="w-8 h-8 rounded-full border border-white/50 object-cover flex-shrink-0" style={{ filter: 'blur(6px)' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white leading-tight truncate select-none" style={{ filter: 'blur(5px)', userSelect: 'none' }}>{inf.display_name}</div>
                  <div className="text-xs text-white/80 truncate select-none" style={{ filter: 'blur(4px)', userSelect: 'none' }}>{handle}</div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1"><Lock size={11} className="text-white" /><span className="text-white text-xs font-semibold">Ver</span></div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3 pb-3">
                <img src={img} alt={inf.display_name} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-md" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white leading-tight truncate">{inf.display_name}</div>
                  <div className="text-xs text-white/80 truncate">{handle}</div>
                </div>
                <span className="text-xs bg-emerald-500 text-white font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Libre</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Badge variant="default" size="sm">{niche}</Badge>
              <span className="flex items-center gap-0.5 text-xs text-gray-400"><MapPin size={10} />{inf.city ?? 'España'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="font-bold text-gray-900">{Number(inf.rating_avg).toFixed(1)}</span>
              <span className="text-gray-400">({inf.total_reviews})</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900">{formatK(inf.followers_ig)}</div>
              <div className="text-xs text-gray-400">Seguidores</div>
            </div>
            <div className="text-center border-x border-gray-100">
              <div className="text-sm font-bold text-emerald-600">{er}%</div>
              <div className="text-xs text-gray-400">Engagement</div>
            </div>
            <div className="text-center">
              <div className={`text-sm font-bold text-gray-900 ${showLocked ? 'select-none' : ''}`} style={showLocked ? { filter: 'blur(4px)' } : {}}>{inf.price_min ?? '—'}€</div>
              <div className="text-xs text-gray-400">Desde</div>
            </div>
          </div>
          {showLocked ? (
            <Button variant="secondary" size="sm" fullWidth onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowModal(true); }}><Lock size={13} /> Desbloquear perfil</Button>
          ) : (
            <Button variant={featured ? 'primary' : 'outline'} size="sm" fullWidth onClick={handleContactar}><MessageCircle size={13} /> Contactar</Button>
          )}
        </div>
      </div>
      {showModal && <UnlockModal inf={inf} onClose={() => setShowModal(false)} onUnlocked={onUnlock} unlocking={unlocking} userId={userId} />}
      {showContact && <ContactModal creator={inf} onClose={() => setShowContact(false)} />}
    </>
  );
}

/* ─── UGC CREATOR CARD ─────────────────────────────────────────────────────── */
function UgcCreatorCard({
  creator, featured, userType, userId,
}: {
  creator: PublicInfluencerProfile;
  featured?: boolean;
  userType: string | null;
  userId: string | null;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleContact = () => {
    if (!userId) { router.push('/login'); return; }
    setShowModal(true);
  };

  const name = creator.display_name;
  const handle = displayHandle(creator);
  const niche = primaryNiche(creator);
  const img = imgSeed(creator);
  const portfolio = ugcPortfolio(creator);
  const contentTypes = ugcContentTypes(creator);
  const priceVideo = creator.price_max ?? 150;
  const pricePhoto = creator.price_min ?? 80;
  const available = true;

  return (
    <div className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${featured ? 'border-violet-300 ring-2 ring-violet-100 shadow-md' : 'border-gray-100 shadow-sm'}`}>
      {/* Portfolio grid */}
      <div className="relative h-40 grid grid-cols-3 gap-0.5 overflow-hidden bg-gray-100">
        {portfolio.map((src, i) => (
          <div key={i} className={`overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`} style={i === 0 ? { gridRow: 'span 2' } : {}}>
            <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className="flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            <Video size={10} fill="white" /> UGC
          </span>
          {featured && <span className="flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full"><Zap size={10} fill="white" /> Top</span>}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2.5 px-3 pb-3">
          <img src={img} alt={name} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-md" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white leading-tight truncate">{name}</div>
            <div className="text-xs text-white/80 truncate">{handle}</div>
          </div>
          {available
            ? <span className="text-xs bg-emerald-500 text-white font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Libre</span>
            : <span className="text-xs bg-gray-500/80 text-white font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Ocupado</span>
          }
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Badge variant="default" size="sm">{niche}</Badge>
            <span className="flex items-center gap-0.5 text-xs text-gray-400"><MapPin size={10} />{creator.city ?? 'España'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="font-bold text-gray-900">{Number(creator.rating_avg).toFixed(1)}</span>
            <span className="text-gray-400">({creator.total_reviews})</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {contentTypes.map(ct => (
            <span key={ct} className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
              {CONTENT_TYPE_ICONS[ct]} {ct}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <div className="text-sm font-bold text-gray-900">{priceVideo}€</div>
            <div className="text-xs text-gray-400">por vídeo</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <div className="text-sm font-bold text-gray-900">{pricePhoto}€</div>
            <div className="text-xs text-gray-400">por foto</div>
          </div>
        </div>
        <Button
          variant={featured ? 'primary' : 'outline'}
          size="sm"
          fullWidth
          onClick={handleContact}
          disabled={!available}
        >
          {!userId ? 'Entra para contactar' : 'Contactar'}
        </Button>
      </div>
      {showModal && <ContactModal creator={creator} onClose={() => setShowModal(false)} />}
    </div>
  );
}

/* ─── APPLY MODAL ──────────────────────────────────────────────────────────── */
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

/* ─── COLLAB CARD ──────────────────────────────────────────────────────────── */
function CollabCard({ c, userId, userType }: { c: PublicCollaboration; userId: string | null; userType: string | null }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(false);
  const [gate, setGate] = useState<{ current?: number; limit?: number; upgradeTo: 'starter' | 'pro' } | null>(null);

  const handleApplyClick = async () => {
    if (!userId) { router.push('/login'); return; }
    if (userType === 'brand') return;

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

/* ─── MAIN PAGE ────────────────────────────────────────────────────────────── */
export default function DiscoverPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'influencers' | 'collabs'>('influencers');
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'influencer' | 'ugc'>('all');
  const [niche, setNiche] = useState('Todos');
  const [city, setCity] = useState('Todas');
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const userType = (user?.user_metadata?.user_type as string | undefined) ?? null;
  const { credits, loading: unlocking, unlock, persistedUnlocked } = useCredits(user?.id ?? null);

  // Datos reales desde Supabase
  const [influencers, setInfluencers] = useState<PublicInfluencerProfile[]>([]);
  const [ugcCreators, setUgcCreators] = useState<PublicInfluencerProfile[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [collabs, setCollabs] = useState<PublicCollaboration[]>([]);
  const [loadingCollabs, setLoadingCollabs] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingCreators(true);
    Promise.all([getPublicInfluencers(), getPublicUgcCreators()])
      .then(([infs, ugcs]) => {
        if (!cancelled) {
          setInfluencers(infs);
          setUgcCreators(ugcs);
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoadingCreators(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingCollabs(true);
    getPublicCollaborations()
      .then(data => { if (!cancelled) setCollabs(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoadingCollabs(false); });
    return () => { cancelled = true; };
  }, []);

  const [drawerCreator, setDrawerCreator] = useState<PublicInfluencerProfile | null>(null);
  const [drawerChatLoading, setDrawerChatLoading] = useState(false);

  const isUnlocked = (infId: string) => persistedUnlocked.has(infId);

  const handleUnlock = async (id: string) => {
    const result = await unlock(id);
    return result ?? { success: false };
  };

  const handleDrawerOpenChat = async (inf: PublicInfluencerProfile) => {
    if (!user?.id) { router.push('/login'); return; }
    setDrawerChatLoading(true);
    try {
      const conv = await getOrCreateDirectConversation(user.id, inf.user_id);
      router.push(`/chat/direct/${conv.id}`);
    } catch {
      setDrawerChatLoading(false);
    }
  };

  // Filters
  const filterProfile = (p: PublicInfluencerProfile) => {
    const matchNiche = niche === 'Todos' || p.niches?.includes(niche);
    const matchCity = city === 'Todas' || p.city === city;
    const matchQ = !query
      || p.display_name.toLowerCase().includes(query.toLowerCase())
      || (p.instagram_handle?.includes(query.toLowerCase()) ?? false);
    return matchNiche && matchCity && matchQ;
  };

  const filteredInfluencers = influencers.filter(filterProfile);
  const filteredUgc = ugcCreators.filter(filterProfile);

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

  const featuredInfluencers = showInfluencers ? filteredInfluencers.filter(isFeatured) : [];
  const restInfluencers = showInfluencers ? filteredInfluencers.filter(p => !isFeatured(p)) : [];
  const featuredUgc = showUgc ? filteredUgc.filter(isFeatured) : [];
  const restUgc = showUgc ? filteredUgc.filter(p => !isFeatured(p)) : [];

  const totalCount = (showInfluencers ? filteredInfluencers.length : 0) + (showUgc ? filteredUgc.length : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {drawerCreator && (
        <CreatorDrawer
          inf={drawerCreator}
          isUnlocked={isUnlocked(drawerCreator.id)}
          isBrand={userType === 'brand'}
          userId={user?.id ?? null}
          unlocking={unlocking}
          onUnlock={handleUnlock}
          onClose={() => setDrawerCreator(null)}
          onOpenChat={handleDrawerOpenChat}
          chatLoading={drawerChatLoading}
        />
      )}

      <div className="pt-16">
        {/* Sticky search bar */}
        <div className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">

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

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

          {tab === 'influencers' ? (
            loadingCreators ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <div className="text-sm text-gray-500">Cargando perfiles...</div>
              </div>
            ) : (
              <div className="space-y-10">

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
                        <InfluencerCard key={inf.id} inf={inf} featured credits={credits} unlocking={unlocking} onUnlock={handleUnlock} isUnlocked={isUnlocked(inf.id)} userId={user?.id ?? null} userType={userType} onPreview={setDrawerCreator} />
                      ))}
                      {featuredUgc.map(c => (
                        <UgcCreatorCard key={c.id} creator={c} featured userType={userType} userId={user?.id ?? null} />
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900">
                      {creatorFilter === 'ugc' ? 'Creadores UGC' : creatorFilter === 'influencer' ? 'Influencers' : niche !== 'Todos' ? niche : 'Todos los creadores'}
                      <span className="text-gray-400 font-normal text-sm ml-2">{totalCount} perfiles</span>
                    </h2>
                  </div>

                  {restInfluencers.length > 0 && showInfluencers && (
                    <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-5">
                      <Lock size={18} className="text-violet-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">Algunos perfiles están bloqueados</div>
                        <div className="text-xs text-gray-500">Consigue créditos para acceder a todos los contactos sin límite</div>
                      </div>
                      <Button variant="secondary" size="sm" className="flex-shrink-0" onClick={() => router.push('/pricing')}>Ver planes</Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {restInfluencers.map(inf => (
                      <InfluencerCard key={inf.id} inf={inf} credits={credits} unlocking={unlocking} onUnlock={handleUnlock} isUnlocked={isUnlocked(inf.id)} userId={user?.id ?? null} userType={userType} onPreview={setDrawerCreator} />
                    ))}
                    {restUgc.map(c => (
                      <UgcCreatorCard key={c.id} creator={c} userType={userType} userId={user?.id ?? null} />
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
            )
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
