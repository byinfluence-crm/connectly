'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Upload, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getApplicationsByCreator } from '@/lib/supabase';
import type { ApplicationWithCollab } from '@/lib/supabase';
import DeliveryModal from '@/components/DeliveryModal';

type Filter = 'all' | 'pending' | 'accepted' | 'rejected';

const STATUS_CONFIG = {
  pending:  { label: 'En espera',  icon: <Clock size={12} />,       color: 'bg-amber-50 text-amber-700' },
  accepted: { label: 'Aceptada',   icon: <CheckCircle size={12} />, color: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Rechazada',  icon: <XCircle size={12} />,     color: 'bg-red-50 text-red-600' },
};

const COLLAB_STATUS: Record<string, { label: string; color: string }> = {
  active:               { label: 'Activa',            color: 'bg-violet-50 text-violet-700' },
  pending_brand_review: { label: 'Esperando marca',   color: 'bg-amber-50 text-amber-700' },
  completed:            { label: 'Completada',         color: 'bg-emerald-50 text-emerald-700' },
};

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState<ApplicationWithCollab[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [deliveryApp, setDeliveryApp] = useState<ApplicationWithCollab | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.id) return;
    getApplicationsByCreator(user.id)
      .then(data => { setApps(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.id]);

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
    <>
      {deliveryApp && user && (
        <DeliveryModal
          applicationId={deliveryApp.id}
          influencerId={user.id}
          brandId={deliveryApp.brand_id}
          brandName={(deliveryApp.collab?.brand as { display_name: string } | null)?.display_name ?? 'Marca'}
          collabTitle={deliveryApp.collab?.title ?? ''}
          onClose={() => setDeliveryApp(null)}
          onDone={() => {
            setDeliveryApp(null);
            setApps(prev => prev.map(a =>
              a.id === deliveryApp.id ? { ...a, collab_status: 'pending_brand_review' } : a
            ));
          }}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-lg font-bold text-gray-900">
          Mis aplicaciones {apps.length > 0 && <span className="text-gray-400 font-normal">({apps.length})</span>}
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
              {f === 'all' ? 'Todas' : STATUS_CONFIG[f].label} ({counts[f]})
            </button>
          ))}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              {apps.length === 0
                ? 'Todavía no has aplicado a ninguna colaboración.'
                : 'No hay aplicaciones con este filtro.'}
            </p>
            {apps.length === 0 && (
              <Link href="/discover">
                <button className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
                  Buscar colaboraciones
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => {
              const collab = app.collab as { title?: string; type?: string; budget?: number | null; brand?: { display_name?: string } | null } | null;
              const statusCfg = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG];
              const collabCfg = app.collab_status ? COLLAB_STATUS[app.collab_status] : null;

              return (
                <div key={app.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(collab?.brand?.display_name ?? 'M').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-gray-900 truncate">{collab?.title ?? 'Colaboración'}</span>
                        {statusCfg && (
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.color}`}>
                            {statusCfg.icon} {statusCfg.label}
                          </span>
                        )}
                        {collabCfg && app.status === 'accepted' && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${collabCfg.color}`}>
                            {collabCfg.label}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 flex gap-2 flex-wrap">
                        {collab?.brand?.display_name && <span>{collab.brand.display_name}</span>}
                        {collab?.type && <span>· {collab.type}</span>}
                        {collab?.budget && <span>· {collab.budget}€</span>}
                        <span>· {new Date(app.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  {app.status === 'accepted' && (
                    <div className="flex gap-2 pt-3 border-t border-gray-50">
                      <Link href={`/chat/${app.id}`} className="flex-1">
                        <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors">
                          <MessageCircle size={13} /> Chat con la marca
                        </button>
                      </Link>
                      {(!app.collab_status || app.collab_status === 'active') && (
                        <button
                          onClick={() => setDeliveryApp(app)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          <Upload size={13} /> Entregar resultados
                        </button>
                      )}
                      {app.collab_status === 'completed' && (
                        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                          <CheckCircle size={13} /> Completada
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
