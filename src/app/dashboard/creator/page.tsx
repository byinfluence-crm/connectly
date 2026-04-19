'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock, CheckCircle, ChevronRight,
  MapPin, Flame, User, Send, Upload,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';
import { getApplicationsByCreator, getPublicCollaborations } from '@/lib/supabase';
import type { ApplicationWithCollab, PublicCollaboration } from '@/lib/supabase';
import DeliveryModal from '@/components/DeliveryModal';

const COLLAB_TYPE_LABELS: Record<string, string> = {
  canje: 'Canje',
  pago: 'Pago',
  mixto: 'Canje + Pago',
};

function fmtDate(d: string | null): string {
  if (!d) return 'sin fecha';
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function availableBudget(c: PublicCollaboration): string {
  if (c.collab_type === 'canje') return 'Canje';
  if (!c.budget_min && !c.budget_max) return 'A convenir';
  const n = c.budget_min ?? c.budget_max;
  return `${n}€`;
}

const APP_STATUS = {
  pending:  { label: 'En espera', variant: 'warning' as const },
  accepted: { label: 'Aceptada', variant: 'success' as const },
  rejected: { label: 'Rechazada', variant: 'danger' as const },
};

/* ─── MAIN PAGE ─────────────────────────────────────────────────── */
export default function CreatorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithCollab[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [deliveryApp, setDeliveryApp] = useState<ApplicationWithCollab | null>(null);
  const [availableCollabs, setAvailableCollabs] = useState<PublicCollaboration[]>([]);

  const displayName = (user?.user_metadata?.display_name as string) ?? 'Creador';

  // Cargar aplicaciones reales desde Supabase
  useEffect(() => {
    if (!user?.id) return;
    getApplicationsByCreator(user.id)
      .then(setApplications)
      .catch(console.error)
      .finally(() => setLoadingApps(false));
  }, [user?.id]);

  // Cargar colaboraciones públicas activas
  useEffect(() => {
    getPublicCollaborations()
      .then(cs => setAvailableCollabs(cs.slice(0, 6)))
      .catch(console.error);
  }, []);

  const totalSent = applications.length;
  const accepted = applications.filter(a => a.status === 'accepted').length;
  const pending = applications.filter(a => a.status === 'pending').length;

  return (
    <>
      {deliveryApp && user && (
        <DeliveryModal
          applicationId={deliveryApp.id}
          influencerId={user.id}
          brandId={deliveryApp.brand_id}
          brandName={deliveryApp.collab?.brand?.brand_name ?? 'Marca'}
          collabTitle={deliveryApp.collab?.title ?? ''}
          onClose={() => setDeliveryApp(null)}
          onDone={() => {
            setDeliveryApp(null);
            setApplications(prev =>
              prev.map(a => a.id === deliveryApp.id ? { ...a, collab_status: 'pending_brand_review' } : a)
            );
          }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

          {/* ── Cabecera ── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Hola, {displayName} 👋
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Tienes {pending} aplicación{pending !== 1 ? 'es' : ''} en espera</p>
            </div>
            <Link href={user ? `/creators/${user.id}` : '/discover'}>
              <Button size="sm" variant="outline">
                <User size={15} /> Mi perfil
              </Button>
            </Link>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<Send size={18} className="text-violet-600" />}
              label="Enviadas"
              value={totalSent}
              bg="bg-violet-50"
            />
            <StatCard
              icon={<CheckCircle size={18} className="text-emerald-600" />}
              label="Aceptadas"
              value={accepted}
              bg="bg-emerald-50"
            />
            <StatCard
              icon={<Clock size={18} className="text-amber-600" />}
              label="En espera"
              value={pending}
              bg="bg-amber-50"
              highlight={pending > 0}
            />
          </div>

          {/* ── Colaboraciones disponibles ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Colaboraciones para ti</h2>
              <Link href="/discover?tab=collabs" className="text-xs text-violet-600 font-semibold flex items-center gap-1 hover:text-violet-700">
                Ver todas <ChevronRight size={13} />
              </Link>
            </div>

            {availableCollabs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <div className="text-2xl mb-2">🔎</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Aún no hay colaboraciones activas</div>
                <div className="text-xs text-gray-400 mb-4">
                  Cuando las marcas publiquen campañas, aparecerán aquí
                </div>
                <Button size="sm" variant="secondary" onClick={() => router.push('/discover?tab=collabs')}>
                  Ir a Discover
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCollabs.map(c => {
                  const brandName = c.brand?.brand_name ?? 'Marca';
                  const typeLabel = COLLAB_TYPE_LABELS[c.collab_type] ?? c.collab_type;
                  const budgetStr = availableBudget(c);
                  return (
                    <div
                      key={c.id}
                      onClick={() => router.push('/discover?tab=collabs')}
                      className={`bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                        c.is_boosted ? 'border-violet-200 ring-2 ring-violet-50' : 'border-gray-100'
                      }`}
                    >
                      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-violet-100 to-violet-50">
                        {c.brand?.logo_url && (
                          <img src={c.brand.logo_url} alt={brandName} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        {c.is_boosted && (
                          <span className="absolute top-2 left-2 flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            <Flame size={9} fill="white" /> Destacada
                          </span>
                        )}
                        <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                          c.collab_type === 'pago' ? 'bg-emerald-500 text-white' : c.collab_type === 'canje' ? 'bg-amber-500 text-white' : 'bg-violet-600 text-white'
                        }`}>
                          {typeLabel}{c.collab_type !== 'canje' && budgetStr !== 'A convenir' ? ` · ${budgetStr}` : ''}
                        </span>
                        <div className="absolute bottom-2 left-3">
                          <div className="text-white text-xs font-bold">{brandName}</div>
                          <div className="flex items-center gap-1 text-white/70 text-xs">
                            <MapPin size={9} />{c.city ?? '—'}
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2 mb-2">{c.title}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Hasta {fmtDate(c.deadline)}</span>
                          <Button size="sm" variant="secondary" className="text-xs py-1 px-3">
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Mis aplicaciones ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Mis aplicaciones</h2>
            </div>

            {loadingApps ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-16" />
                ))}
              </div>
            ) : applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map(app => (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {app.collab?.brand?.brand_name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {app.collab?.brand?.brand_name ?? 'Marca'}
                        </span>
                        <Badge variant={APP_STATUS[app.status].variant} size="sm">
                          {APP_STATUS[app.status].label}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 truncate">{app.collab?.title ?? '—'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {app.collab?.collab_type}{app.collab?.budget_min ? ` · ${app.collab.budget_min}€` : ''}
                      </div>
                    </div>
                    {app.status === 'accepted' && (
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Link href={`/chat/${app.id}`}>
                          <Button size="sm" variant="secondary" className="text-xs">Chat</Button>
                        </Link>
                        {(!app.collab_status || app.collab_status === 'active') && (
                          <Button
                            size="sm"
                            className="text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setDeliveryApp(app)}
                          >
                            <Upload size={12} /> Entregar
                          </Button>
                        )}
                        {app.collab_status === 'pending_brand_review' && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-xl">
                            <Clock size={11} /> Esperando marca
                          </span>
                        )}
                        {app.collab_status === 'completed' && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-xl">
                            <CheckCircle size={11} /> Completada
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <div className="text-2xl mb-2">🚀</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Aún no has aplicado a ninguna colaboración</div>
                <div className="text-xs text-gray-400 mb-4">
                  Encuentra oportunidades que encajan con tu nicho
                </div>
                <Button size="sm" variant="secondary" onClick={() => router.push('/discover')}>
                  Ver colaboraciones
                </Button>
              </div>
            )}
          </section>

          {/* ── Banner perfil público ── */}
          <section>
            <div className="bg-gradient-to-r from-violet-600 to-violet-800 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-white font-bold mb-1">¿Cómo te ven las marcas?</div>
                <div className="text-violet-200 text-sm">Revisa y completa tu perfil público para destacar</div>
              </div>
              <Link href={user ? `/creators/${user.id}` : '/discover'}>
                <Button variant="outline" size="sm" className="border-white/40 text-white hover:bg-white/10 flex-shrink-0">
                  Ver mi perfil <ChevronRight size={14} />
                </Button>
              </Link>
            </div>
          </section>

      </div>
    </>
  );
}

function StatCard({
  icon, label, value, bg, highlight,
}: { icon: React.ReactNode; label: string; value: number; bg: string; highlight?: boolean }) {
  return (
    <div className={`${bg} rounded-2xl p-4 ${highlight ? 'ring-2 ring-amber-300' : ''}`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 leading-snug">{label}</div>
    </div>
  );
}
