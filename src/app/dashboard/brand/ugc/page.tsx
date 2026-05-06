'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Video, Clock, CheckCircle, Film, Camera, Image, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getUgcProjectsByBrand } from '@/lib/supabase';
import type { UgcProject, UgcProjectStatus } from '@/types';

const STATUS_CONFIG: Record<UgcProjectStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft:              { label: 'Borrador',          color: 'bg-gray-100 text-gray-600',      icon: <Clock size={11} /> },
  briefing_sent:      { label: 'Briefing enviado',  color: 'bg-blue-50 text-blue-700',       icon: <Clock size={11} /> },
  accepted:           { label: 'Aceptado',           color: 'bg-violet-50 text-violet-700',   icon: <CheckCircle size={11} /> },
  in_production:      { label: 'En producción',      color: 'bg-amber-50 text-amber-700',     icon: <Film size={11} /> },
  content_submitted:  { label: 'Contenido enviado',  color: 'bg-indigo-50 text-indigo-700',   icon: <CheckCircle size={11} /> },
  brand_reviewing:    { label: 'En revisión',        color: 'bg-orange-50 text-orange-700',   icon: <AlertCircle size={11} /> },
  revision_requested: { label: 'Revisión pedida',    color: 'bg-red-50 text-red-600',         icon: <AlertCircle size={11} /> },
  completed:          { label: 'Completado',          color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle size={11} /> },
  cancelled:          { label: 'Cancelado',           color: 'bg-gray-100 text-gray-500',      icon: <Clock size={11} /> },
  disputed:           { label: 'En disputa',          color: 'bg-red-100 text-red-700',        icon: <AlertCircle size={11} /> },
};

const CONTENT_ICONS: Record<string, React.ReactNode> = {
  video: <Video size={12} />,
  reel: <Film size={12} />,
  foto: <Camera size={12} />,
  carrusel: <Image size={12} />,
  story: <Film size={12} />,
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function UgcProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<UgcProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.id) return;
    getUgcProjectsByBrand(user.id)
      .then(data => { setProjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const active   = projects.filter(p => !['completed', 'cancelled', 'disputed', 'draft'].includes(p.status));
  const draft    = projects.filter(p => p.status === 'draft');
  const finished = projects.filter(p => ['completed', 'cancelled', 'disputed'].includes(p.status));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Proyectos UGC</h1>
          <p className="text-sm text-gray-500 mt-0.5">Contenido profesional creado para tus canales</p>
        </div>
        <Link href="/dashboard/brand/ugc/new">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
            <Plus size={15} /> Nuevo proyecto
          </button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Video size={36} className="text-gray-200 mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-700 mb-1">Sin proyectos UGC todavía</p>
          <p className="text-xs text-gray-400 mb-5">
            Crea tu primer proyecto y elige un creador de contenido para producirlo.
          </p>
          <Link href="/dashboard/brand/ugc/new">
            <button className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
              Crear primer proyecto
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { title: 'En curso', items: active },
            { title: 'Borradores', items: draft },
            { title: 'Finalizados', items: finished },
          ].map(({ title, items }) =>
            items.length === 0 ? null : (
              <div key={title}>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title} ({items.length})</h2>
                <div className="space-y-3">
                  {items.map(project => {
                    const cfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft;
                    const budget = project.budget_cents ? `${(project.budget_cents / 100).toFixed(0)}€` : null;
                    return (
                      <Link key={project.id} href={`/dashboard/brand/ugc/${project.id}`}>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-violet-200 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                              <Video size={18} className="text-violet-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-sm font-bold text-gray-900 truncate">{project.title}</span>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>
                                  {cfg.icon} {cfg.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                                {project.content_types.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    {project.content_types.slice(0, 3).map(ct => (
                                      <span key={ct} className="flex items-center gap-0.5 bg-gray-50 px-1.5 py-0.5 rounded-lg">
                                        {CONTENT_ICONS[ct] ?? <Film size={12} />} {ct}
                                      </span>
                                    ))}
                                  </span>
                                )}
                                {project.deliverables_count > 1 && (
                                  <span>{project.deliverables_count} entregables</span>
                                )}
                                {budget && <span className="font-semibold text-gray-600">{budget}</span>}
                                {project.deadline && <span>· Plazo {fmt(project.deadline)}</span>}
                                <span>· {fmt(project.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
