'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getBrandProfileByUserId, updateBrandProfile } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import type { BrandProfile, BrandLocation } from '@/lib/supabase';
import Link from 'next/link';
import {
  Camera, Plus, Trash2, MapPin, AtSign, Globe,
  Loader2, CheckCircle2, AlertCircle, Music2, ExternalLink,
} from 'lucide-react';

const SECTORS     = ['Gastronomía', 'Moda', 'Fitness', 'Viajes', 'Belleza', 'Tecnología', 'Hostelería', 'Retail', 'Salud', 'Otro'];
const PRICE_OPTS  = ['€', '€€', '€€€', '€€€€'] as const;
const CITIES      = ['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Bilbao', 'Málaga', 'Zaragoza', 'Otra'];

async function uploadImage(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const res = await authFetch('/api/brand/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error ?? 'Error al subir imagen');
  return data.url as string;
}

export default function BrandProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const coverInputRef   = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef    = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    brand_name:    '',
    sector:        '',
    cuisine_type:  '',
    price_range:   '' as BrandProfile['price_range'],
    description:   '',
    collab_brief:  '',
    city:          '',
    website:       '',
    instagram_url: '',
    tiktok_url:    '',
    schedule:      '',
    logo_url:        null as string | null,
    cover_photo_url: null as string | null,
    gallery_urls:  [] as string[],
    locations:     [] as BrandLocation[],
  });

  const [uploadingCover,   setUploadingCover]   = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingLogo,    setUploadingLogo]    = useState(false);

  useEffect(() => {
    if (!user) return;
    getBrandProfileByUserId(user.id).then(p => {
      if (p) {
        setProfile(p);
        setForm({
          brand_name:      p.brand_name      ?? '',
          sector:          p.sector          ?? '',
          cuisine_type:    p.cuisine_type    ?? '',
          price_range:     p.price_range     ?? null,
          description:     p.description     ?? '',
          collab_brief:    p.collab_brief    ?? '',
          city:            p.city            ?? '',
          website:         p.website         ?? '',
          instagram_url:   p.instagram_url   ?? '',
          tiktok_url:      p.tiktok_url      ?? '',
          schedule:        p.schedule        ?? '',
          logo_url:        p.logo_url        ?? null,
          cover_photo_url: p.cover_photo_url ?? null,
          gallery_urls:    p.gallery_urls    ?? [],
          locations:       p.locations       ?? [],
        });
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadImage(file, 'logo');
      setForm(f => ({ ...f, logo_url: url }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Error subiendo el logo'); }
    finally { setUploadingLogo(false); }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCover(true);
    try {
      const url = await uploadImage(file, 'cover');
      setForm(f => ({ ...f, cover_photo_url: url }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Error subiendo la foto de portada'); }
    finally { setUploadingCover(false); }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !user) return;
    setUploadingGallery(true);
    try {
      const urls = await Promise.all(files.map(f => uploadImage(f, 'gallery')));
      setForm(f => ({ ...f, gallery_urls: [...f.gallery_urls, ...urls] }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Error subiendo fotos a la galería'); }
    finally { setUploadingGallery(false); }
  };

  const removeGalleryPhoto = (url: string) => {
    setForm(f => ({ ...f, gallery_urls: f.gallery_urls.filter(u => u !== url) }));
  };

  const addLocation = () => {
    setForm(f => ({ ...f, locations: [...f.locations, { name: '', address: '', city: '', maps_url: '' }] }));
  };

  const updateLocation = (i: number, field: keyof BrandLocation, value: string) => {
    setForm(f => {
      const locs = [...f.locations];
      locs[i] = { ...locs[i], [field]: value };
      return { ...f, locations: locs };
    });
  };

  const removeLocation = (i: number) => {
    setForm(f => ({ ...f, locations: f.locations.filter((_, idx) => idx !== i) }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await updateBrandProfile(user.id, {
        brand_name:      form.brand_name,
        sector:          form.sector       || null,
        cuisine_type:    form.cuisine_type || null,
        price_range:     form.price_range  || null,
        description:     form.description  || null,
        collab_brief:    form.collab_brief || null,
        city:            form.city         || null,
        website:         form.website      || null,
        instagram_url:   form.instagram_url || null,
        tiktok_url:      form.tiktok_url   || null,
        schedule:        form.schedule     || null,
        logo_url:        form.logo_url,
        cover_photo_url: form.cover_photo_url,
        gallery_urls:    form.gallery_urls,
        locations:       form.locations,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil de marca</h1>
          <p className="text-sm text-gray-500 mt-0.5">Información visible para los creadores</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {user && (
            <Link
              href={`/brands/${user.id}`}
              target="_blank"
              className="flex items-center gap-1.5 text-sm text-violet-600 font-medium hover:text-violet-700 px-3 py-2.5 rounded-xl hover:bg-violet-50 transition-colors"
            >
              <ExternalLink size={14} /> Ver perfil público
            </Link>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : null}
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-8">

        {/* ── Sección 1: Identidad ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Identidad</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la marca</label>
              <input
                value={form.brand_name}
                onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sector</label>
                <select
                  value={form.sector}
                  onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                >
                  <option value="">Selecciona sector</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Concepto / especialidad</label>
                <input
                  value={form.cuisine_type}
                  onChange={e => setForm(f => ({ ...f, cuisine_type: e.target.value }))}
                  placeholder="ej. Italiana, Tapas, Fusión..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rango de precio</label>
                <div className="flex gap-2">
                  {PRICE_OPTS.map(p => (
                    <button
                      key={p} type="button"
                      onClick={() => setForm(f => ({ ...f, price_range: f.price_range === p ? null : p }))}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.price_range === p ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad principal</label>
                <select
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                >
                  <option value="">Selecciona ciudad</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Cuéntanos sobre tu negocio, historia, valores..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white resize-none"
              />
            </div>
          </div>
        </section>

        {/* ── Sección 2: Fotos ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Fotos</h2>

          {/* Logo */}
          <div className="mb-6 pb-6 border-b border-gray-100 flex items-center gap-5">
            <div
              onClick={() => !uploadingLogo && logoInputRef.current?.click()}
              className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 hover:border-violet-400 transition-colors overflow-hidden cursor-pointer shrink-0 bg-gray-50 flex items-center justify-center group"
            >
              {form.logo_url ? (
                <>
                  <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingLogo ? <Loader2 size={18} className="text-white animate-spin" /> : <Camera size={18} className="text-white" />}
                  </div>
                </>
              ) : uploadingLogo ? (
                <Loader2 size={20} className="text-violet-500 animate-spin" />
              ) : (
                <Camera size={20} className="text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Logo de la marca</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG o PNG · Fondo blanco recomendado · Máx. 10 MB</p>
              <button
                type="button"
                onClick={() => !uploadingLogo && logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="text-xs text-violet-600 font-medium mt-2 hover:text-violet-700 disabled:opacity-50"
              >
                {uploadingLogo ? 'Subiendo...' : form.logo_url ? 'Cambiar logo' : 'Subir logo'}
              </button>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>

          {/* Portada */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto de portada (fachada del local)</label>
            <div
              onClick={() => coverInputRef.current?.click()}
              className="relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 hover:border-violet-400 transition-colors overflow-hidden"
              style={{ height: 180 }}
            >
              {form.cover_photo_url ? (
                <>
                  <img src={form.cover_photo_url} alt="Portada" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    {uploadingCover
                      ? <Loader2 size={24} className="text-white animate-spin" />
                      : <Camera size={24} className="text-white" />
                    }
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                  {uploadingCover
                    ? <Loader2 size={24} className="animate-spin text-violet-500" />
                    : <><Camera size={24} /><span className="text-sm">Subir foto de portada</span></>
                  }
                </div>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </div>

          {/* Galería */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Galería (carta, ambiente, platos...)</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {form.gallery_urls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryPhoto(url)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-violet-400 flex flex-col items-center justify-center gap-1 text-gray-400 transition-colors"
              >
                {uploadingGallery
                  ? <Loader2 size={18} className="animate-spin text-violet-500" />
                  : <><Plus size={18} /><span className="text-xs">Añadir</span></>
                }
              </button>
            </div>
            <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
          </div>
        </section>

        {/* ── Sección 3: Ubicaciones ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Ubicaciones</h2>
            <button
              type="button"
              onClick={addLocation}
              className="flex items-center gap-1.5 text-sm text-violet-600 font-medium hover:text-violet-700"
            >
              <Plus size={15} />
              Añadir local
            </button>
          </div>
          {form.locations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Añade las ubicaciones de tus locales
            </p>
          ) : (
            <div className="space-y-4">
              {form.locations.map((loc, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <MapPin size={15} className="text-violet-500" />
                      Local {i + 1}
                    </div>
                    <button type="button" onClick={() => removeLocation(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={loc.name}
                      onChange={e => updateLocation(i, 'name', e.target.value)}
                      placeholder="Nombre del local"
                      className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                    />
                    <input
                      value={loc.city}
                      onChange={e => updateLocation(i, 'city', e.target.value)}
                      placeholder="Ciudad"
                      className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                    />
                  </div>
                  <input
                    value={loc.address}
                    onChange={e => updateLocation(i, 'address', e.target.value)}
                    placeholder="Dirección completa"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  />
                  <input
                    value={loc.maps_url ?? ''}
                    onChange={e => updateLocation(i, 'maps_url', e.target.value)}
                    placeholder="Link de Google Maps (opcional)"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Sección 4: Redes sociales ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Redes sociales y web</h2>
          <div className="space-y-4">
            <div className="relative">
              <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.instagram_url}
                onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))}
                placeholder="https://instagram.com/tumarca"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              />
            </div>
            <div className="relative">
              <Music2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.tiktok_url}
                onChange={e => setForm(f => ({ ...f, tiktok_url: e.target.value }))}
                placeholder="https://tiktok.com/@tumarca"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              />
            </div>
            <div className="relative">
              <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://tumarca.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              />
            </div>
          </div>
        </section>

        {/* ── Sección 5: Para creadores ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Para creadores</h2>
          <p className="text-xs text-gray-400 mb-5">Esta información aparece cuando un creador ve tu perfil</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Horario de visitas para contenido</label>
              <input
                value={form.schedule}
                onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
                placeholder="ej. Lunes a viernes de 12h a 15h · Cenas a partir de 20h"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Brief de colaboración</label>
              <p className="text-xs text-gray-400 mb-2">Qué buscas en un creador, tono de contenido, qué NO quieres, productos estrella...</p>
              <textarea
                value={form.collab_brief}
                onChange={e => setForm(f => ({ ...f, collab_brief: e.target.value }))}
                placeholder={`ej. Buscamos creadores con contenido auténtico y cercano. Nuestro plato estrella es el tartar de atún. No queremos vídeos con música ruidosa ni filtros excesivos. Las visitas deben ser en horario de cena para mejor ambiente...`}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white resize-none"
              />
            </div>
          </div>
        </section>

      </div>

      {/* Botón flotante en mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-violet-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg hover:bg-violet-700 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : null}
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
