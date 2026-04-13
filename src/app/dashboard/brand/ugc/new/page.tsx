'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Video, Camera, Film, Image, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase, createUgcProject } from '@/lib/supabase';

const CONTENT_TYPES = [
  { id: 'video',    label: 'Vídeo',    icon: <Video size={14} />,   desc: 'MP4, formato horizontal o vertical' },
  { id: 'reel',     label: 'Reel',     icon: <Film size={14} />,    desc: '9:16, hasta 90 segundos' },
  { id: 'foto',     label: 'Foto',     icon: <Camera size={14} />,  desc: 'JPG/PNG alta resolución' },
  { id: 'carrusel', label: 'Carrusel', icon: <Image size={14} />,   desc: '3–10 imágenes secuenciales' },
  { id: 'story',    label: 'Story',    icon: <Film size={14} />,    desc: '9:16, hasta 15 segundos' },
];

const USAGE_RIGHTS = [
  { id: 'brand_owned', label: 'Propiedad total', desc: 'Tú eres dueño del contenido y puedes publicarlo en cualquier canal' },
  { id: 'shared',      label: 'Uso compartido', desc: 'El creador también puede publicar el contenido en su perfil' },
  { id: 'licensed',    label: 'Licencia',        desc: 'Uso limitado en canales y período acordados por contrato' },
];

export default function NewUgcProjectPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    description: '',
    content_types: [] as string[],
    deliverables_count: 1,
    budget: '',
    deadline: '',
    usage_rights: 'brand_owned' as 'brand_owned' | 'shared' | 'licensed',
    revision_limit: 2,
    notes: '',
  });
  const [refUrl, setRefUrl] = useState('');
  const [refUrls, setRefUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggleContentType = (type: string) => {
    set('content_types', form.content_types.includes(type)
      ? form.content_types.filter(t => t !== type)
      : [...form.content_types, type]
    );
  };

  const addRefUrl = () => {
    const trimmed = refUrl.trim();
    if (trimmed && !refUrls.includes(trimmed)) {
      setRefUrls(prev => [...prev, trimmed]);
      setRefUrl('');
    }
  };

  const handleSubmit = async (asDraft = false) => {
    if (!user?.id) return;
    if (!form.title.trim()) { setError('El título es obligatorio'); return; }
    if (form.content_types.length === 0) { setError('Selecciona al menos un tipo de contenido'); return; }

    setSaving(true);
    setError('');

    try {
      const project = await createUgcProject(user.id, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        content_types: form.content_types,
        deliverables_count: form.deliverables_count,
        budget_cents: form.budget ? Math.round(parseFloat(form.budget) * 100) : undefined,
        deadline: form.deadline || undefined,
        usage_rights: form.usage_rights,
        revision_limit: form.revision_limit,
        reference_urls: refUrls,
        notes: form.notes.trim() || undefined,
      });

      if (!asDraft) {
        // Cambiar a briefing_sent automáticamente si se publica
        await supabase.from('ugc_projects').update({ status: 'briefing_sent' }).eq('id', project.id);
      }

      router.push(`/dashboard/brand/ugc/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el proyecto');
      setSaving(false);
    }
  };

  const displayName = (user?.user_metadata?.display_name as string) ?? 'Mi Marca';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard/brand" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <span className="text-sm font-bold text-gray-900 flex-1">Nuevo proyecto UGC</span>
          <div className="flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-2.5 py-1.5 rounded-full">
            <Video size={12} /> UGC
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Info banner */}
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 text-sm text-violet-800">
          <strong>¿Cómo funciona el UGC?</strong> Rellena el briefing, elige un creador y él producirá el contenido para que tú lo publiques en tus canales. Sin seguidores — solo talento creativo.
        </div>

        {/* Detalles del proyecto */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Detalles del proyecto</h2>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Título del proyecto *</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ej: 3 vídeos de producto para colección verano"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Descripción del proyecto</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Explica qué quieres comunicar, el tono de la marca, el producto o servicio..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>
        </div>

        {/* Tipos de contenido */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Tipos de contenido *</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONTENT_TYPES.map(ct => {
              const selected = form.content_types.includes(ct.id);
              return (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => toggleContentType(ct.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${selected ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300 bg-white'}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {ct.icon}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold ${selected ? 'text-violet-900' : 'text-gray-800'}`}>{ct.label}</div>
                    <div className="text-xs text-gray-400 truncate">{ct.desc}</div>
                  </div>
                  {selected && <div className="ml-auto w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0"><span className="text-white text-[10px] font-bold">✓</span></div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cantidad, presupuesto y fecha */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Volumen y presupuesto</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Nº de entregables</label>
              <input
                type="number"
                min="1"
                max="50"
                value={form.deliverables_count}
                onChange={e => set('deliverables_count', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Presupuesto total (€)</label>
              <input
                type="number"
                min="0"
                step="10"
                value={form.budget}
                onChange={e => set('budget', e.target.value)}
                placeholder="Ej: 500"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Fecha límite</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => set('deadline', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Derechos de uso */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Derechos de uso del contenido</h2>
            <p className="text-xs text-gray-400 mt-0.5">¿Cómo podrás usar el contenido una vez entregado?</p>
          </div>
          <div className="space-y-2">
            {USAGE_RIGHTS.map(ur => (
              <button
                key={ur.id}
                type="button"
                onClick={() => set('usage_rights', ur.id as 'brand_owned' | 'shared' | 'licensed')}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${form.usage_rights === ur.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${form.usage_rights === ur.id ? 'border-violet-600 bg-violet-600' : 'border-gray-300'}`} />
                <div>
                  <div className={`text-sm font-semibold ${form.usage_rights === ur.id ? 'text-violet-900' : 'text-gray-800'}`}>{ur.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{ur.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Revisiones y referencias */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Revisiones y referencias</h2>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Número de revisiones incluidas</label>
            <div className="flex gap-2">
              {[1, 2, 3, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set('revision_limit', n)}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${form.revision_limit === n ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 hover:border-violet-300'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">URLs de referencia</label>
            <div className="flex gap-2">
              <input
                value={refUrl}
                onChange={e => setRefUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRefUrl(); } }}
                placeholder="https://ejemplo.com/referencia"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={addRefUrl}
                className="px-4 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            {refUrls.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {refUrls.map(url => (
                  <div key={url} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="flex-1 text-xs text-gray-600 truncate">{url}</span>
                    <button onClick={() => setRefUrls(prev => prev.filter(u => u !== url))} className="text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Briefing detallado / Notas adicionales</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Estilo visual, colores de marca, mensajes clave, qué NO hacer, ejemplos de lo que te gusta..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Guardar borrador
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Publicando...' : 'Publicar briefing'}
          </button>
        </div>
      </div>
    </div>
  );
}
