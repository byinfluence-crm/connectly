'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, MessageCircle, Star, Users } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getApplicationsByBrand, updateApplicationStatus } from '@/lib/supabase';
import type { ApplicationWithCreator } from '@/lib/supabase';

type Filter = 'all' | 'pending' | 'accepted' | 'rejected';

const STATUS_CONFIG = {
  pending:  { label: 'Pendiente',  color: 'bg-amber-50 text-amber-700' },
  accepted: { label: 'Aceptado',   color: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Rechazado',  color: 'bg-red-50 text-red-600' },
};

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
}

export default function CandidatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState<ApplicationWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.id) return;
    getApplicationsByBrand(user.id)
      .then(data => { setApps(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.id]);

  const handleStatus = async (appId: string, status: 'accepted' | 'rejected') => {
    if (!user?.id) return;
    await updateApplicationStatus(appId, status, user.id);
    setApps(as => as.map(a => a.id === appId ? { ...a, status } : a));
  };

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);

  const counts = {
    all: apps.length,
    pending: apps.filter(a => a.status === 'pending').length,
    accepted: apps.filter(a => a.status === 'accepted').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-lg font-bold text-gray-900">
        Candidatos {apps.length > 0 && <span className="text-gray-400 font-normal">({apps.length})</span>}
      </h1>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'accepted', 'rejected'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filter === f ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'
              }`}
            >
              {f === 'all' ? 'Todos' : STATUS_CONFIG[f].label} ({counts[f]})
            </button>
          ))}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <Users size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {apps.length === 0
                ? 'Aún no tienes candidatos. Publica una colaboración para empezar a recibir solicitudes.'
                : 'No hay candidatos con este filtro.'}
            </p>
            {apps.length === 0 && (
              <Link href="/dashboard/brand/collabs/new">
                <button className="mt-4 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
                  Crear campaña
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => {
              const creator = app.creator as { id?: string; display_name?: string; city?: string; niche?: string } | null;
              const collab = app.collab as { title?: string } | null;
              const cfg = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG];

              return (
                <div key={app.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(creator?.display_name ?? 'C').charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-gray-900">{creator?.display_name ?? 'Creador'}</span>
                        {cfg && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                        )}
                        {app.collab_status === 'pending_brand_review' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Pendiente valorar</span>
                        )}
                        {app.collab_status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Completada</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 flex gap-2 flex-wrap">
                        {creator?.niche && <span>{creator.niche}</span>}
                        {creator?.city && <span>· {creator.city}</span>}
                        {collab?.title && <span>· {collab.title}</span>}
                        <span>· {new Date(app.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      {app.message && (
                        <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 px-3 py-2 rounded-xl italic">
                          &ldquo;{app.message}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    {creator?.id && (
                      <Link href={`/creators/${creator.id}`} className="flex-shrink-0">
                        <button className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors">
                          <Star size={12} /> Ver perfil
                        </button>
                      </Link>
                    )}

                    <Link href={`/chat/${app.id}`} className="flex-shrink-0">
                      <button className="flex items-center gap-1 px-3 py-2 rounded-xl bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors">
                        <MessageCircle size={12} /> Chat
                      </button>
                    </Link>

                    {app.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatus(app.id, 'accepted')}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle size={13} /> Aceptar
                        </button>
                        <button
                          onClick={() => handleStatus(app.id, 'rejected')}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                          <XCircle size={13} /> Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
