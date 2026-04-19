'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';

const NICHES = ['Moda', 'Belleza', 'Fitness', 'Gastronomía', 'Viajes', 'Tecnología', 'Lifestyle', 'Gaming', 'Música', 'Deporte', 'Bienestar', 'Familia', 'Mascotas', 'Arte', 'Humor'];
const CITIES = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza', 'Murcia', 'Online / España entera'];

export default function NewCollabPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'canje',
    niche: '',
    city: '',
    budget: '',
    deadline: '',
    requirements: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (status: 'draft' | 'active') => {
    if (!user?.id) return;
    if (!form.title.trim()) { setError('El título es obligatorio'); return; }
    if (!form.niche) { setError('Selecciona un nicho'); return; }
    if (!form.city) { setError('Selecciona una ciudad'); return; }
    if (!form.deadline) { setError('Indica la fecha límite'); return; }

    setSaving(true);
    setError('');

    const { error: err } = await supabase.from('collabs').insert({
      brand_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      niche: form.niche,
      city: form.city,
      budget: form.budget ? parseInt(form.budget) : null,
      deadline: form.deadline,
      requirements: form.requirements.trim() || null,
      status,
    });

    setSaving(false);
    if (err) { setError(err.message); return; }
    router.push('/dashboard/brand/collabs');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-lg font-bold text-gray-900">Nueva colaboración</h1>

        {/* Básico */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Detalles de la campaña</h2>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Título *</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ej: Foodie para reels de nueva carta de primavera"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Explica qué buscas, el estilo de contenido, qué producto o servicio quieres promocionar..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Tipo de compensación *</label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="canje">Canje de producto</option>
                <option value="pago">Pago en efectivo</option>
                <option value="ambos">Canje + Pago</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Presupuesto (€)</label>
              <input
                type="number"
                value={form.budget}
                onChange={e => set('budget', e.target.value)}
                placeholder="Opcional"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Segmentación */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Segmentación</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Nicho *</label>
              <select
                value={form.niche}
                onChange={e => set('niche', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="">Seleccionar...</option>
                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Ciudad *</label>
              <select
                value={form.city}
                onChange={e => set('city', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="">Seleccionar...</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Fecha límite *</label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => set('deadline', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Requisitos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Requisitos del creador</h2>
          <textarea
            value={form.requirements}
            onChange={e => set('requirements', e.target.value)}
            placeholder="Ej: Mínimo 5.000 seguidores, perfil en Instagram activo, con experiencia en contenido gastronómico..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Guardar borrador
          </button>
          <button
            onClick={() => handleSubmit('active')}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Publicando...' : 'Publicar campaña'}
          </button>
        </div>
    </div>
  );
}
