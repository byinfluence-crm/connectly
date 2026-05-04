'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import Link from 'next/link';
import {
  Loader2, Save, CheckCircle2, AlertCircle, Camera, ExternalLink, RefreshCw,
} from 'lucide-react';

interface CreatorProfile {
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  followers_ig: number;
  followers_tt: number;
  niches: string[];
  price_min: number | null;
  price_max: number | null;
  creator_type: 'influencer' | 'ugc' | 'both';
  fiscal_name: string | null;
  fiscal_nif: string | null;
  fiscal_address: string | null;
  billing_email: string | null;
}

interface SyncStats {
  ig?: { followers: number; avg_views: number; avg_likes: number; er: number; posts_analyzed: number };
  tt?: { followers: number; avg_views: number; avg_likes: number; er: number; posts_analyzed: number };
  ig_error?: string;
  tt_error?: string;
  last_sync_at?: string;
}

function fmtN(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return n.toString();
}

const NICHES = ['Gastronomía', 'Moda', 'Fitness', 'Viajes', 'Lifestyle', 'Tecnología', 'Belleza', 'Deporte', 'Gaming', 'Otro'];
const CITIES = ['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Bilbao', 'Málaga', 'Zaragoza', 'Otra'];

const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-5">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function CreatorProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);

  useEffect(() => {
    if (!user) return;
    authFetch('/api/creator/profile')
      .then(r => r.json())
      .then(d => {
        const p = d.profile;
        setProfile(p ? {
          ...p,
          niches: p.niches ?? [],          // null-safe: DB puede devolver null
          followers_ig: p.followers_ig ?? 0,
          followers_tt: p.followers_tt ?? 0,
        } : {
          display_name: user.user_metadata?.display_name ?? '',
          bio: null,
          avatar_url: null,
          city: null,
          instagram_handle: null,
          tiktok_handle: null,
          followers_ig: 0,
          followers_tt: 0,
          niches: [],
          price_min: null,
          price_max: null,
          creator_type: 'influencer',
          fiscal_name: null,
          fiscal_nif: null,
          fiscal_address: null,
          billing_email: null,
        });
      })
      .catch(() => setError('No se pudo cargar el perfil. Recarga la página.'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await authFetch('/api/creator/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al guardar');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError('Error de red. Comprueba tu conexión.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setAvatarUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'avatar');
      const res = await authFetch('/api/creator/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Error al subir la imagen');
      setProfile({ ...profile, avatar_url: data.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error subiendo la foto de perfil');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSync = async () => {
    if (!profile) return;
    setSyncing(true);
    setError('');
    try {
      const res = await authFetch('/api/creator/sync-social', { method: 'POST' });
      const data: SyncStats & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al sincronizar');
      setSyncStats(data);
      // Actualizar seguidores en el form con los datos reales
      setProfile(p => p ? {
        ...p,
        followers_ig: data.ig?.followers ?? p.followers_ig,
        followers_tt: data.tt?.followers ?? p.followers_tt,
      } : p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const toggleNiche = (niche: string) => {
    if (!profile) return;
    const niches = profile.niches.includes(niche)
      ? profile.niches.filter(n => n !== niche)
      : [...profile.niches, niche];
    setProfile({ ...profile, niches });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-violet-600" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
          <p className="text-sm text-gray-500 mt-0.5">Actualiza tu información como creador</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/creators/${user?.id}`}
            className="flex items-center gap-1.5 text-sm text-violet-600 font-medium hover:text-violet-700 px-3 py-2.5 rounded-xl hover:bg-violet-50 transition-colors"
          >
            <ExternalLink size={14} />
            Ver perfil público
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="mb-5 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={16} className="shrink-0" />
          Perfil actualizado correctamente
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Identidad */}
        <Section title="Identidad">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-5 pb-5 border-b border-gray-100">
            <div
              className="relative shrink-0 cursor-pointer group"
              onClick={() => !avatarUploading && avatarRef.current?.click()}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  className="w-20 h-20 rounded-2xl object-cover"
                  alt=""
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center">
                  <span className="text-violet-700 font-bold text-2xl">
                    {profile.display_name.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
              {/* Overlay visible en hover o mientras sube */}
              <div className={`absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center transition-opacity ${avatarUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {avatarUploading
                  ? <Loader2 size={20} className="text-white animate-spin" />
                  : <Camera size={20} className="text-white" />
                }
              </div>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Foto de perfil</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG o PNG · Máximo 10 MB</p>
              <button
                onClick={() => !avatarUploading && avatarRef.current?.click()}
                disabled={avatarUploading}
                className="text-xs text-violet-600 font-medium mt-2 hover:text-violet-700 disabled:opacity-50"
              >
                {avatarUploading ? 'Subiendo...' : 'Cambiar foto'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Nombre o alias *">
              <input
                value={profile.display_name}
                onChange={e => setProfile({ ...profile, display_name: e.target.value })}
                placeholder="Tu nombre o nombre artístico"
                className={inputClass}
              />
            </Field>

            <Field label="Sobre ti">
              <textarea
                value={profile.bio ?? ''}
                onChange={e => setProfile({ ...profile, bio: e.target.value || null })}
                placeholder="Cuéntale a las marcas quién eres, qué contenido haces y qué te diferencia..."
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </Field>

            <Field label="Tipo de creador">
              <div className="flex gap-3">
                {(['influencer', 'ugc', 'both'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setProfile({ ...profile, creator_type: type })}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      profile.creator_type === type
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {type === 'influencer' ? 'Influencer' : type === 'ugc' ? 'UGC Creator' : 'Ambos'}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </Section>

        {/* Ubicación y nicho */}
        <Section title="Ubicación y nicho">
          <div className="space-y-5">
            <Field label="Ciudad">
              <select
                value={profile.city ?? ''}
                onChange={e => setProfile({ ...profile, city: e.target.value || null })}
                className={inputClass}
              >
                <option value="">Selecciona ciudad</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2.5">Nichos</p>
              <div className="flex flex-wrap gap-2">
                {NICHES.map(niche => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => toggleNiche(niche)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      profile.niches.includes(niche)
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Redes sociales */}
        <Section title="Redes sociales">
          {/* Handles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <Field label="Instagram">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
                <input
                  value={profile.instagram_handle ?? ''}
                  onChange={e => setProfile({ ...profile, instagram_handle: e.target.value || null })}
                  placeholder="usuario"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </Field>
            <Field label="TikTok">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
                <input
                  value={profile.tiktok_handle ?? ''}
                  onChange={e => setProfile({ ...profile, tiktok_handle: e.target.value || null })}
                  placeholder="usuario"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </Field>
          </div>

          {/* Botón sincronizar */}
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || (!profile.instagram_handle && !profile.tiktok_handle)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-200 text-violet-700 text-sm font-medium hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-5"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar datos reales'}
          </button>

          {/* Resultados de la sync */}
          {syncStats && (
            <div className="space-y-3">
              {syncStats.ig && (
                <div className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-pink-700 mb-2">Instagram · {syncStats.ig.posts_analyzed} publicaciones analizadas</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Seguidores</p>
                      <p className="font-bold text-gray-900">{fmtN(syncStats.ig.followers)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Media views</p>
                      <p className="font-bold text-gray-900">{fmtN(syncStats.ig.avg_views)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Engagement</p>
                      <p className="font-bold text-gray-900">{syncStats.ig.er}%</p>
                    </div>
                  </div>
                </div>
              )}
              {syncStats.ig_error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  Instagram: {syncStats.ig_error}
                </p>
              )}
              {syncStats.tt && (
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">TikTok · {syncStats.tt.posts_analyzed} vídeos analizados</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Seguidores</p>
                      <p className="font-bold text-gray-900">{fmtN(syncStats.tt.followers)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Media views</p>
                      <p className="font-bold text-gray-900">{fmtN(syncStats.tt.avg_views)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Engagement</p>
                      <p className="font-bold text-gray-900">{syncStats.tt.er}%</p>
                    </div>
                  </div>
                </div>
              )}
              {syncStats.tt_error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  TikTok: {syncStats.tt_error}
                </p>
              )}
              {syncStats.last_sync_at && (
                <p className="text-xs text-gray-400">
                  Última sincronización: {new Date(syncStats.last_sync_at).toLocaleString('es-ES')}
                  {' · '}
                  <button onClick={handleSave} className="text-violet-600 font-medium hover:text-violet-700">
                    Guardar cambios
                  </button>
                </p>
              )}
            </div>
          )}
        </Section>

        {/* Tarifas */}
        <Section title="Tarifas orientativas">
          <p className="text-xs text-gray-400 mb-4">
            Las marcas lo ven como referencia al contactarte. Puedes negociar cada colaboración por separado.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Desde (€)">
              <input
                type="number"
                min={0}
                value={profile.price_min ?? ''}
                onChange={e => setProfile({ ...profile, price_min: parseInt(e.target.value) || null })}
                placeholder="50"
                className={inputClass}
              />
            </Field>
            <Field label="Hasta (€)">
              <input
                type="number"
                min={0}
                value={profile.price_max ?? ''}
                onChange={e => setProfile({ ...profile, price_max: parseInt(e.target.value) || null })}
                placeholder="500"
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        {/* Datos fiscales */}
        <Section title="Datos fiscales">
          <p className="text-xs text-gray-400 mb-4">
            Necesarios para emitir facturas cuando recibas pagos por colaboraciones.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre fiscal">
              <input
                value={profile.fiscal_name ?? ''}
                onChange={e => setProfile({ ...profile, fiscal_name: e.target.value || null })}
                placeholder="Nombre completo o razón social"
                className={inputClass}
              />
            </Field>
            <Field label="NIF / CIF">
              <input
                value={profile.fiscal_nif ?? ''}
                onChange={e => setProfile({ ...profile, fiscal_nif: e.target.value || null })}
                placeholder="12345678A"
                className={inputClass}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Dirección fiscal">
                <input
                  value={profile.fiscal_address ?? ''}
                  onChange={e => setProfile({ ...profile, fiscal_address: e.target.value || null })}
                  placeholder="Calle, número, código postal, ciudad"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Email de facturación">
                <input
                  type="email"
                  value={profile.billing_email ?? ''}
                  onChange={e => setProfile({ ...profile, billing_email: e.target.value || null })}
                  placeholder="facturacion@email.com"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Bottom save */}
        <div className="flex justify-end pt-2 pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
