'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { getMarketplaceUser } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import Link from 'next/link';
import { Building2, Plus, X, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';

interface Brand {
  id: string;
  user_id: string;
  brand_name: string;
  logo_url: string | null;
  sector: string | null;
  city: string | null;
  description: string | null;
  website: string | null;
  is_verified: boolean;
  linked_at: string;
}

const SECTORS = ['Gastronomía', 'Moda', 'Fitness', 'Viajes', 'Belleza', 'Tecnología', 'Hostelería', 'Retail', 'Salud', 'Otro'];
const CITIES  = ['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Bilbao', 'Málaga', 'Zaragoza', 'Otra'];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<{ temp_password: string | null; brand_name: string } | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    brand_name: '', email: '', sector: '', city: '', description: '', website: '',
  });


  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }

    getMarketplaceUser(user.id)
      .then(p => {
        if (p.user_type !== 'superadmin') router.replace('/dashboard');
      })
      .catch(() => router.replace('/login'));
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    authFetch('/api/admin/brands')
      .then(r => r.json())
      .then(d => setBrands(d.brands ?? []))
      .finally(() => setLoadingBrands(false));
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const res = await authFetch('/api/admin/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setFormError(data.error ?? 'Error al crear la marca');
      setFormLoading(false);
      return;
    }

    setResult({ temp_password: data.temp_password ?? null, brand_name: form.brand_name });
    setForm({ brand_name: '', email: '', sector: '', city: '', description: '', website: '' });
    setShowForm(false);
    setFormLoading(false);

    // Refrescar lista
    authFetch('/api/admin/brands').then(r => r.json()).then(d => setBrands(d.brands ?? []));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de agencia</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona las marcas que forman parte de tu agencia</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setResult(null); setFormError(''); }}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
        >
          <Plus size={16} />
          Nueva marca
        </button>
      </div>

      {/* Credenciales de la marca recién creada */}
      {result && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-800 mb-1">
                Marca &ldquo;{result.brand_name}&rdquo; creada
              </p>
              {result.temp_password ? (
                <>
                  <p className="text-sm text-green-700 mb-3">
                    Comparte estas credenciales con la marca de forma segura. La contraseña solo se muestra una vez.
                  </p>
                  <div className="bg-white rounded-xl border border-green-200 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Contraseña temporal</p>
                      <p className="font-mono text-lg font-bold text-gray-900 tracking-widest">
                        {showPassword ? result.temp_password : '••••••••••••'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPassword(p => !p)}
                      className="p-2 rounded-lg hover:bg-gray-50 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    La marca puede cambiar su contraseña en cualquier momento desde /forgot
                  </p>
                </>
              ) : (
                <p className="text-sm text-green-700">
                  Marca creada sin acceso propio. Puedes editar su perfil desde el panel.
                </p>
              )}
            </div>
            <button onClick={() => setResult(null)} className="text-green-500 hover:text-green-700">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Formulario nueva marca */}
      {showForm && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Crear nueva marca</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la marca *</label>
              <input
                required
                value={form.brand_name}
                onChange={e => setForm({ ...form, brand_name: e.target.value })}
                placeholder="ej. Restaurante Casa Nova"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email de acceso
                <span className="ml-1.5 text-xs font-normal text-gray-400">(opcional — se genera uno si no lo pones)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="marca@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sector</label>
              <select
                value={form.sector}
                onChange={e => setForm({ ...form, sector: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="">Selecciona sector</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
              <select
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="">Selecciona ciudad</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Web</label>
              <input
                type="url"
                value={form.website}
                onChange={e => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción breve de la marca..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white resize-none"
              />
            </div>

            {formError && (
              <div className="md:col-span-2 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertCircle size={16} className="shrink-0" />
                {formError}
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 transition-colors"
              >
                {formLoading && <Loader2 size={15} className="animate-spin" />}
                {formLoading ? 'Creando...' : 'Crear marca'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de marcas */}
      {loadingBrands ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-violet-600" />
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Building2 size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="font-medium text-gray-500">Aún no tienes marcas vinculadas</p>
          <p className="text-sm text-gray-400 mt-1">Crea tu primera marca con el botón de arriba</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map(brand => (
            <div
              key={brand.user_id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-violet-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center shrink-0">
                  {brand.logo_url
                    ? <img src={brand.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    : <span className="text-violet-700 font-bold text-sm">{brand.brand_name.charAt(0)}</span>
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{brand.brand_name}</p>
                  {brand.sector && <p className="text-xs text-gray-400">{brand.sector}</p>}
                </div>
                {brand.is_verified && (
                  <CheckCircle2 size={16} className="text-violet-500 shrink-0" />
                )}
              </div>
              {brand.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{brand.description}</p>
              )}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {brand.city && (
                    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-full">
                      {brand.city}
                    </span>
                  )}
                </div>
                <Link
                  href={`/dashboard/admin/brands/${brand.user_id}`}
                  className="flex items-center gap-1.5 text-xs text-violet-600 font-medium hover:text-violet-700 px-2.5 py-1.5 rounded-lg hover:bg-violet-50 transition-colors"
                >
                  <Pencil size={12} />
                  Editar perfil
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
