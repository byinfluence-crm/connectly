'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  X, MapPin, BadgeCheck, Star, Users, TrendingUp, Lock,
  MessageCircle, ExternalLink, Flame,
} from 'lucide-react';
import type { PublicInfluencerProfile } from '@/lib/supabase';
import Button from './ui/Button';

function formatK(n: number) {
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);
}

interface Props {
  inf: PublicInfluencerProfile;
  isUnlocked: boolean;
  isBrand: boolean;
  userId: string | null;
  unlocking: boolean;
  onUnlock: (id: string) => Promise<{ success: boolean; error_code?: string }>;
  onClose: () => void;
  onOpenChat: (inf: PublicInfluencerProfile) => void;
  chatLoading: boolean;
}

export default function CreatorDrawer({
  inf, isUnlocked, isBrand, userId, unlocking, onUnlock, onClose, onOpenChat, chatLoading,
}: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handle = inf.instagram_handle ? `@${inf.instagram_handle}` : null;
  const niche = inf.niches?.[0] ?? inf.niche ?? 'Lifestyle';
  const portfolioUrls = inf.portfolio_urls && inf.portfolio_urls.length > 0
    ? inf.portfolio_urls.slice(0, 3)
    : Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/ugc-${inf.id.slice(0, 8)}-${i}/300/300`);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">

        {/* Header */}
        <div className="relative flex-shrink-0">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-br from-violet-400 to-violet-700 overflow-hidden">
            <img
              src={inf.avatar_url ?? `https://picsum.photos/seed/cover-${inf.id.slice(0, 6)}/600/200`}
              alt=""
              className="w-full h-full object-cover opacity-40"
            />
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Avatar */}
          <div className="absolute -bottom-10 left-5">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-violet-400 to-violet-600">
              {inf.avatar_url
                ? <img src={inf.avatar_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                    {inf.display_name.charAt(0).toUpperCase()}
                  </div>
              }
            </div>
          </div>

          {/* Badges */}
          <div className="absolute -bottom-4 right-4 flex gap-1.5">
            {inf.is_boosted && (
              <span className="flex items-center gap-0.5 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                <Flame size={9} fill="white" /> Destacado
              </span>
            )}
            {inf.is_verified && (
              <span className="flex items-center gap-0.5 bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                <BadgeCheck size={10} /> Verificado
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pt-14 px-5 pb-6 space-y-5">

          {/* Identity */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
              {inf.display_name}
              {inf.is_verified && <BadgeCheck size={16} className="text-sky-500" />}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
              {handle && <span className="text-violet-600 font-medium">{handle}</span>}
              <span className="bg-violet-50 text-violet-700 font-medium px-2 py-0.5 rounded-full">{niche}</span>
              {inf.city && (
                <span className="flex items-center gap-0.5 text-gray-400">
                  <MapPin size={10} /> {inf.city}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {inf.bio && (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{inf.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Users size={14} className="text-violet-500 mx-auto mb-1" />
              <div className="text-sm font-bold text-gray-900">{inf.followers_ig ? formatK(inf.followers_ig) : '—'}</div>
              <div className="text-[10px] text-gray-400">Seguidores</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <TrendingUp size={14} className="text-emerald-500 mx-auto mb-1" />
              <div className="text-sm font-bold text-gray-900">{inf.engagement_rate_ig ? `${Number(inf.engagement_rate_ig).toFixed(1)}%` : '—'}</div>
              <div className="text-[10px] text-gray-400">Engagement</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Star size={14} className="text-amber-400 fill-amber-400 mx-auto mb-1" />
              <div className="text-sm font-bold text-gray-900">{inf.rating_avg > 0 ? Number(inf.rating_avg).toFixed(1) : '—'}</div>
              <div className="text-[10px] text-gray-400">{inf.total_reviews > 0 ? `${inf.total_reviews} reseñas` : 'Sin reseñas'}</div>
            </div>
          </div>

          {/* Precio */}
          {(isUnlocked || !isBrand) && (inf.price_min || inf.price_max) && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
              <div className="text-xs text-gray-500 mb-0.5">Tarifa orientativa</div>
              <div className="text-sm font-bold text-gray-900">
                {inf.price_min && inf.price_max
                  ? `${inf.price_min}€ – ${inf.price_max}€`
                  : `desde ${inf.price_min ?? inf.price_max}€`}
              </div>
            </div>
          )}

          {/* Portfolio */}
          <div>
            <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Portfolio</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {portfolioUrls.map((src, i) => (
                <div key={i} className={`aspect-square rounded-xl overflow-hidden bg-gray-100 ${!isUnlocked && isBrand ? 'relative' : ''}`}>
                  <img src={src} alt="" className={`w-full h-full object-cover ${!isUnlocked && isBrand ? 'blur-sm scale-105' : ''}`} />
                  {!isUnlocked && isBrand && i === 1 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock size={16} className="text-white drop-shadow" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-white px-5 py-4 space-y-2.5">
          {isBrand && !isUnlocked && (
            <Button
              fullWidth
              loading={unlocking}
              onClick={() => onUnlock(inf.id)}
            >
              <Lock size={14} /> Desbloquear y chatear
            </Button>
          )}
          {isBrand && isUnlocked && (
            <Button
              fullWidth
              loading={chatLoading}
              onClick={() => onOpenChat(inf)}
            >
              <MessageCircle size={14} /> Abrir chat directo
            </Button>
          )}
          <Link href={`/creators/${inf.user_id}`} className="block">
            <Button fullWidth variant="outline">
              <ExternalLink size={13} /> Ver perfil completo
            </Button>
          </Link>
          {!userId && (
            <Link href="/register" className="block">
              <Button fullWidth>Regístrate para contactar</Button>
            </Link>
          )}
        </div>

      </div>
    </>
  );
}
