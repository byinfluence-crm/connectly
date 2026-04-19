'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MoreHorizontal, Clock, FileText } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import {
  getCollaborationsByBrand,
  updateCollaborationStatus,
  deleteCollaboration,
  type Collaboration,
} from '@/lib/supabase';

type CollabStatus = 'active' | 'draft' | 'closed';

const STATUS_CONFIG: Record<CollabStatus, { label: string; color: string }> = {
  active: { label: 'Activa', color: 'bg-emerald-100 text-emerald-700' },
  draft:  { label: 'Borrador', color: 'bg-gray-100 text-gray-600' },
  closed: { label: 'Cerrada', color: 'bg-red-50 text-red-600' },
};

const TYPE_LABELS: Record<string, string> = {
  canje: 'Canje',
  pago: 'Pago',
  mixto: 'Canje + Pago',
};

function fmt(deadline: string | null) {
  if (!deadline) return 'sin fecha';
  const d = new Date(deadline);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function budgetLabel(c: Collaboration): string | null {
  if (!c.budget_min && !c.budget_max) return null;
  if (c.budget_min && c.budget_max && c.budget_min === c.budget_max) return `${c.budget_min}€`;
  if (c.budget_min && c.budget_max) return `${c.budget_min}-${c.budget_max}€`;
  return `${c.budget_min ?? c.budget_max}€`;
}

export default function CollabsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [collabs, setCollabs] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CollabStatus | 'all'>('all');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.id) return;
    getCollaborationsByBrand(user.id)
      .then(setCollabs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleStatusChange = async (id: string, status: CollabStatus) => {
    try {
      await updateCollaborationStatus(id, status);
      setCollabs(cs => cs.map(c => c.id === id ? { ...c, status } : c));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta colaboración?')) return;
    try {
      await deleteCollaboration(id);
      setCollabs(cs => cs.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const filtered = filter === 'all'
    ? collabs
    : collabs.filter(c => c.status === filter);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Mis colaboraciones</h1>
        <Link href="/dashboard/brand/collabs/new">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors">
            <Plus size={14} /> Nueva
          </button>
        </Link>
      </div>

        {/* Filtros */}
        <div className="flex gap-2">
          {(['all', 'active', 'draft', 'closed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filter === s ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'
              }`}
            >
              {s === 'all' ? 'Todas' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              {filter === 'all' ? 'Aún no tienes colaboraciones' : `No hay colaboraciones en estado "${STATUS_CONFIG[filter as CollabStatus]?.label}"`}
            </p>
            <Link href="/dashboard/brand/collabs/new">
              <button className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
                Crear primera campaña
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => {
              const status = c.status as CollabStatus;
              const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
              const budget = budgetLabel(c);
              const niche = c.niches_required?.[0] ?? '—';
              return (
                <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-gray-900 truncate">{c.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                        {budget && (
                          <span className="text-xs text-violet-700 font-semibold bg-violet-50 px-2 py-0.5 rounded-full">
                            {budget}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span>{niche}</span>
                        <span>·</span>
                        <span>{c.city ?? '—'}</span>
                        <span>·</span>
                        <span>{TYPE_LABELS[c.collab_type] ?? c.collab_type}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> Hasta {fmt(c.deadline)}</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(c.id, 'active')}
                          className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          Publicar
                        </button>
                      )}
                      {status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(c.id, 'closed')}
                          className="text-xs px-3 py-1.5 rounded-xl bg-gray-50 text-gray-600 font-semibold hover:bg-gray-100 transition-colors"
                        >
                          Cerrar
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA si hay collabs */}
        {filtered.length > 0 && (
          <Link href="/dashboard/brand/collabs/new">
            <div className="border-2 border-dashed border-violet-200 rounded-2xl p-4 text-center hover:border-violet-400 hover:bg-violet-50/30 transition-colors cursor-pointer">
              <span className="text-sm text-violet-600 font-semibold flex items-center justify-center gap-2">
                <Plus size={16} /> Nueva colaboración
              </span>
            </div>
          </Link>
        )}
    </div>
  );
}
