'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import Link from 'next/link';
import {
  Search, Users, TrendingUp, MapPin, BadgeCheck,
  Loader2, SlidersHorizontal, X,
} from 'lucide-react';

interface Creator {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  niches: string[];
  creator_type: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  followers_ig: number;
  followers_tt: number;
  avg_views_ig: number;
  avg_views_tt: number;
  engagement_rate_ig: number | null;
  engagement_rate_tt: number | null;
  price_min: number | null;
  price_max: number | null;
  is_verified: boolean;
  last_sync_at: string | null;
}

function fmt(n: number) {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function CreatorAvatar({ url, name, size = 44 }: { url: string | null; name: string; size?: number }) {
  const s = `${size}px`;
  if (url) return <img src={url} alt={name} style={{ width: s, height: s }} className="rounded-full object-cover shrink-0" />;
  return (
    <div style={{ width: s, height: s }}
      className="rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shrink-0">
      <span className="text-white font-bold text-sm">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

const ALL_NICHES = [
  'Gastronomía', 'Moda', 'Fitness', 'Viajes', 'Belleza',
  'Tecnología', 'Hostelería', 'Lifestyle', 'Deportes', 'Otro',
];

export default function AdminCreatorsPage() {
  const { user } = useAuth();
  const [creators, setCreators]   = useState<Creator[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [nicheFilter, setNicheFilter] = useState('');
  const [cityFilter, setCityFilter]   = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user) return;
    authFetch('/api/admin/creators')
      .then(r => r.json())
      .then(d => setCreators(d.creators ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  const cities = useMemo(() =>
    [...new Set(creators.map(c => c.city).filter(Boolean) as string[])].sort(),
    [creators]);

  const filtered = useMemo(() => creators.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.display_name.toLowerCase().includes(q) ||
      (c.instagram_handle ?? '').toLowerCase().includes(q) ||
      (c.tiktok_handle ?? '').toLowerCase().includes(q) ||
      (c.city ?? '').toLowerCase().includes(q) ||
      (c.niches ?? []).some(n => n.toLowerCase().includes(q));
    const matchNiche = !nicheFilter || (c.niches ?? []).some(n => n === nicheFilter);
    const matchCity  = !cityFilter  || c.city === cityFilter;
    return matchSearch && matchNiche && matchCity;
  }), [creators, search, nicheFilter, cityFilter]);

  const totalIg = creators.reduce((s, c) => s + (c.followers_ig || 0), 0);
  const totalTt = creators.reduce((s, c) => s + (c.followers_tt || 0), 0);
  const activeFilters = [nicheFilter, cityFilter].filter(Boolean).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creadores</h1>
          <p className="text-sm text-gray-500 mt-0.5">Todos los influencers registrados en la plataforma</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{creators.length}</span> creadores
        </div>
      </div>

      {/* Summary stats */}
      {!loading && creators.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
              <Users size={20} className="text-violet-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{creators.length}</p>
              <p className="text-xs text-gray-500">Creadores totales</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp size={20} className="text-pink-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{fmt(totalIg)}</p>
              <p className="text-xs text-gray-500">Seguidores totales IG</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{fmt(totalTt)}</p>
              <p className="text-xs text-gray-500">Seguidores totales TT</p>
            </div>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, nicho, ciudad, handle..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters || activeFilters > 0 ? 'border-violet-500 text-violet-700 bg-violet-50' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}
        >
          <SlidersHorizontal size={15} />
          Filtros
          {activeFilters > 0 && (
            <span className="bg-violet-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{activeFilters}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nicho</label>
            <select value={nicheFilter} onChange={e => setNicheFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
              <option value="">Todos los nichos</option>
              {ALL_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Ciudad</label>
            <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
              <option value="">Todas las ciudades</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {activeFilters > 0 && (
            <div className="flex items-end">
              <button onClick={() => { setNicheFilter(''); setCityFilter(''); }}
                className="text-sm text-red-500 hover:text-red-700 font-medium py-2">
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Niche quick filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['Gastronomía', 'Moda', 'Fitness', 'Viajes', 'Belleza', 'Tecnología', 'Lifestyle'].map(n => (
          <button key={n}
            onClick={() => setNicheFilter(nicheFilter === n ? '' : n)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${nicheFilter === n ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}>
            {n}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-violet-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <Users size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="font-medium text-gray-500">
            {search || nicheFilter || cityFilter ? 'Sin resultados para esa búsqueda' : 'Aún no hay creadores registrados'}
          </p>
          {(search || nicheFilter || cityFilter) && (
            <button onClick={() => { setSearch(''); setNicheFilter(''); setCityFilter(''); }}
              className="mt-3 text-sm text-violet-600 hover:text-violet-700 font-medium">
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">
            {filtered.length} {filtered.length === 1 ? 'creador' : 'creadores'}{filtered.length < creators.length ? ` de ${creators.length}` : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(creator => {
              const topFollowers = Math.max(creator.followers_ig || 0, creator.followers_tt || 0);
              const topEr = creator.engagement_rate_ig || creator.engagement_rate_tt || null;
              const hasSocials = creator.instagram_handle || creator.tiktok_handle;
              const hasSyncedData = creator.last_sync_at && topFollowers > 0;

              return (
                <Link
                  key={creator.user_id}
                  href={`/creators/${creator.user_id}`}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-violet-200 hover:shadow-sm transition-all flex flex-col gap-4"
                >
                  {/* Top: avatar + name + verified */}
                  <div className="flex items-start gap-3">
                    <CreatorAvatar url={creator.avatar_url} name={creator.display_name} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-gray-900 truncate">{creator.display_name}</p>
                        {creator.is_verified && <BadgeCheck size={15} className="text-violet-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {creator.city && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={11} />{creator.city}
                          </span>
                        )}
                        {creator.creator_type && (
                          <span className="text-xs text-gray-400 capitalize">{creator.creator_type}</span>
                        )}
                      </div>
                      {hasSocials && (
                        <div className="flex gap-2 mt-1">
                          {creator.instagram_handle && (
                            <span className="text-xs text-gray-400">@{creator.instagram_handle}</span>
                          )}
                          {creator.tiktok_handle && !creator.instagram_handle && (
                            <span className="text-xs text-gray-400">@{creator.tiktok_handle}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Niches */}
                  {(creator.niches ?? []).length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {creator.niches.slice(0, 4).map(n => (
                        <span key={n} className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium">{n}</span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">{fmt(creator.followers_ig)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Seg. IG</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">{fmt(creator.followers_tt)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Seg. TT</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">
                        {topEr ? `${topEr}%` : '—'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">ER</p>
                    </div>
                  </div>

                  {/* Price range */}
                  {(creator.price_min || creator.price_max) ? (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-gray-400">Tarifa collab</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {creator.price_min && creator.price_max
                          ? `${creator.price_min}€ – ${creator.price_max}€`
                          : creator.price_min
                            ? `Desde ${creator.price_min}€`
                            : `Hasta ${creator.price_max}€`}
                      </span>
                    </div>
                  ) : null}

                  {!hasSyncedData && (
                    <p className="text-[11px] text-gray-300 text-center -mt-1">Sin datos sincronizados aún</p>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
