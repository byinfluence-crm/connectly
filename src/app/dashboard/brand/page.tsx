'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Users, Clock, CheckCircle,
  XCircle, ChevronRight, MapPin, Flame,
  Star, MessageCircle, Zap,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';
import {
  getApplicationsByBrand, updateApplicationStatus, getDelivery,
  getBrandProfileByUserId, getCollaborationsByBrand,
} from '@/lib/supabase';
import type { ApplicationWithCreator, CollabDelivery, BrandProfile, Collaboration } from '@/lib/supabase';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';
import type { OnboardingStep } from '@/components/OnboardingChecklist';
import BrandReviewModal from '@/components/BrandReviewModal';


const STATUS_LABELS = {
  active: { label: 'Activa', variant: 'success' as const },
  draft:  { label: 'Borrador', variant: 'default' as const },
  closed: { label: 'Cerrada', variant: 'outline' as const },
};

const CAND_STATUS = {
  pending:  { label: 'Pendiente', variant: 'warning' as const },
  accepted: { label: 'Aceptado', variant: 'success' as const },
  rejected: { label: 'Rechazado', variant: 'danger' as const },
};

/* ─── MAIN PAGE ─────────────────────────────────────────────────── */
export default function BrandDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithCreator[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [reviewState, setReviewState] = useState<{
    app: ApplicationWithCreator;
    delivery: CollabDelivery;
  } | null>(null);

  const displayName = (user?.user_metadata?.display_name as string) ?? 'Mi Marca';

  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [collabs, setCollabs] = useState<Collaboration[]>([]);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([getBrandProfileByUserId(user.id), getCollaborationsByBrand(user.id)])
      .then(([profile, fetchedCollabs]) => {
        setBrandProfile(profile);
        setCollabs(fetchedCollabs);
        const hasAny = fetchedCollabs.length > 0;
        setOnboardingSteps([
          {
            id: 'account',
            label: 'Cuenta creada',
            hint: '',
            href: '#',
            done: true,
          },
          {
            id: 'logo',
            label: 'Añade tu logo',
            hint: 'Las marcas con logo generan más confianza en los creadores.',
            href: '/dashboard/brand/settings/profile',
            done: !!profile?.logo_url,
          },
          {
            id: 'description',
            label: 'Escribe una descripción',
            hint: 'Cuéntales a los creadores qué hace tu marca y qué tipo de colaboraciones buscas.',
            href: '/dashboard/brand/settings/profile',
            done: !!profile?.description && profile.description.length > 10,
          },
          {
            id: 'collab',
            label: 'Publica tu primera colaboración',
            hint: 'Es la mejor forma de empezar a recibir solicitudes de creadores.',
            href: '/dashboard/brand/collabs/new',
            done: hasAny,
            critical: true,
          },
          {
            id: 'brief',
            label: 'Define qué buscas en los creadores',
            hint: 'El brief ayuda a que solo apliquen creadores que encajan contigo.',
            href: '/dashboard/brand/settings/profile',
            done: !!profile?.collab_brief && profile.collab_brief.length > 10,
          },
        ]);
      })
      .catch(console.error);
  }, [user?.id]);

  // Cargar candidatos reales desde Supabase
  useEffect(() => {
    if (!user?.id) return;
    getApplicationsByBrand(user.id)
      .then(setApplications)
      .catch(console.error)
      .finally(() => setLoadingApps(false));
  }, [user?.id]);

  const handleOpenReview = async (app: ApplicationWithCreator) => {
    try {
      const delivery = await getDelivery(app.id);
      if (delivery) setReviewState({ app, delivery });
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (appId: string, status: 'accepted' | 'rejected') => {
    if (!user?.id) return;
    try {
      await updateApplicationStatus(appId, status, user.id);
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status } : a)
      );
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const pending = applications.filter(a => a.status === 'pending').length;
  const pendingReviews = applications.filter(
    a => a.status === 'accepted' && a.collab_status === 'pending_brand_review'
  );

  return (
    <>
      {reviewState && user && (
        <BrandReviewModal
          applicationId={reviewState.app.id}
          brandId={user.id}
          influencerId={reviewState.app.influencer_profile_id}
          creatorName={(reviewState.app.creator as { display_name: string } | null)?.display_name ?? 'Creador'}
          collabTitle={reviewState.app.collab?.title ?? ''}
          delivery={reviewState.delivery}
          onClose={() => setReviewState(null)}
          onDone={() => {
            setReviewState(null);
            setApplications(prev =>
              prev.map(a => a.id === reviewState.app.id ? { ...a, collab_status: 'completed' } : a)
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
              <p className="text-sm text-gray-500 mt-0.5">Aquí tienes el resumen de hoy</p>
            </div>
            <Button size="sm" onClick={() => router.push('/dashboard/brand/collabs/new')}>
              <Plus size={15} /> Nueva colaboración
            </Button>
          </div>

          {/* ── Onboarding ── */}
          {onboardingSteps.length > 0 && (
            <OnboardingChecklist role="brand" steps={onboardingSteps} />
          )}

          {/* ── Banner reseñas pendientes ── */}
          {pendingReviews.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-xl">
                ⭐
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-amber-900">
                  Tienes {pendingReviews.length} reseña{pendingReviews.length > 1 ? 's' : ''} pendiente{pendingReviews.length > 1 ? 's' : ''}
                </div>
                <div className="text-xs text-amber-700 mt-0.5">
                  El creador ya entregó resultados. Deja tu valoración para ver las estadísticas completas.
                </div>
              </div>
              <button
                onClick={() => pendingReviews[0] && handleOpenReview(pendingReviews[0])}
                className="flex-shrink-0 text-xs font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-3 py-2 rounded-xl transition-colors"
              >
                Valorar →
              </button>
            </div>
          )}

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<Flame size={18} className="text-violet-600" />}
              label="Colaboraciones activas"
              value={collabs.filter(c => c.status === 'active').length}
              bg="bg-violet-50"
            />
            <StatCard
              icon={<Clock size={18} className="text-amber-600" />}
              label="Candidatos pendientes"
              value={pending}
              bg="bg-amber-50"
              highlight={pending > 0}
            />
            <StatCard
              icon={<Zap size={18} className="text-violet-600" />}
              label="Total colaboraciones"
              value={collabs.length}
              bg="bg-violet-50"
            />
            <StatCard
              icon={<Users size={18} className="text-emerald-600" />}
              label="Candidatos totales"
              value={applications.length}
              bg="bg-emerald-50"
            />
          </div>

          {/* ── Mis colaboraciones ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Mis colaboraciones</h2>
              <Link href="/dashboard/brand/collabs" className="text-xs text-violet-600 font-semibold flex items-center gap-1 hover:text-violet-700">
                Ver todas <ChevronRight size={13} />
              </Link>
            </div>

            {collabs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <div className="text-2xl mb-2">📢</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Aún no has publicado ninguna colaboración</div>
                <div className="text-xs text-gray-400 mb-4">
                  Crea tu primera campaña y empieza a recibir solicitudes de creadores
                </div>
                <Button size="sm" onClick={() => router.push('/dashboard/brand/collabs/new')}>
                  <Plus size={14} /> Nueva colaboración
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {collabs.slice(0, 4).map(collab => {
                  const fmtDeadline = collab.deadline
                    ? new Date(collab.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                    : null;
                  const typeLabel = collab.collab_type === 'canje' ? 'Canje' : collab.collab_type === 'pago' ? 'Pago' : 'Canje + Pago';
                  return (
                    <Link key={collab.id} href={`/dashboard/brand/collabs`}>
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:border-violet-200 transition-all cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900 truncate">{collab.title}</span>
                            <Badge variant={STATUS_LABELS[collab.status as keyof typeof STATUS_LABELS]?.variant ?? 'default'} size="sm">
                              {STATUS_LABELS[collab.status as keyof typeof STATUS_LABELS]?.label ?? collab.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{typeLabel}</span>
                            {collab.budget_min && <span>· {collab.budget_min}€</span>}
                            {fmtDeadline && <span>· Hasta {fmtDeadline}</span>}
                          </div>
                        </div>
                        <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
                <button
                  onClick={() => router.push('/dashboard/brand/collabs/new')}
                  className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm text-gray-400 hover:border-violet-300 hover:text-violet-600 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus size={16} /> Nueva colaboración
                </button>
              </div>
            )}
          </section>

          {/* ── Candidatos recientes ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                Candidatos recientes
                {pending > 0 && (
                  <span className="ml-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {pending} nuevo{pending > 1 ? 's' : ''}
                  </span>
                )}
              </h2>
            </div>

            {loadingApps ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
                ))}
              </div>
            ) : applications.length > 0 ? (
              /* ── Candidatos reales de Supabase ── */
              <div className="space-y-3">
                {applications.map(app => (
                  <div
                    key={app.id}
                    className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                      app.status === 'pending' ? 'border-amber-100' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {app.creator?.display_name?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-semibold text-gray-900">
                            {app.creator?.display_name ?? 'Creador'}
                          </span>
                          <Badge variant={CAND_STATUS[app.status].variant} size="sm">
                            {CAND_STATUS[app.status].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-1">
                          {app.creator?.city && (
                            <span className="flex items-center gap-0.5"><MapPin size={10} />{app.creator.city}</span>
                          )}
                          {app.creator?.niches?.[0] && <span>{app.creator.niches[0]}</span>}
                        </div>
                        <div className="text-xs text-gray-400">
                          Para: <span className="text-gray-600 font-medium">{app.collab?.title ?? '—'}</span>
                        </div>
                        {app.message && (
                          <div className="mt-1.5 text-xs text-gray-500 italic bg-gray-50 rounded-lg px-2.5 py-1.5">
                            "{app.message}"
                          </div>
                        )}
                      </div>
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                        {app.creator?.user_id && (
                          <Link href={`/creators/${app.creator.user_id}`} className="flex-shrink-0">
                            <button className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors">
                              <Star size={13} /> Ver perfil
                            </button>
                          </Link>
                        )}
                        <button
                          onClick={() => handleStatusChange(app.id, 'accepted')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle size={14} /> Aceptar
                        </button>
                        <button
                          onClick={() => handleStatusChange(app.id, 'rejected')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                          <XCircle size={14} /> Rechazar
                        </button>
                      </div>
                    )}
                    {app.status === 'accepted' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                        {app.creator?.user_id && (
                          <Link href={`/creators/${app.creator.user_id}`} className="flex-shrink-0">
                            <button className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors">
                              <Star size={13} /> Ver perfil
                            </button>
                          </Link>
                        )}
                        {app.collab_status === 'pending_brand_review' ? (
                          <button
                            onClick={() => handleOpenReview(app)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors border border-amber-200"
                          >
                            <Star size={13} /> Ver resultados y valorar
                          </button>
                        ) : app.collab_status === 'completed' ? (
                          <span className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            <CheckCircle size={13} /> Completada
                          </span>
                        ) : (
                          <Link href={`/chat/${app.id}`} className="flex-1">
                            <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors">
                              <MessageCircle size={14} /> Abrir chat
                            </button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* ── Estado vacío ── */
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <div className="text-2xl mb-2">📭</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Aún no tienes candidatos</div>
                <div className="text-xs text-gray-400 mb-4">
                  Publica una colaboración y los creadores empezarán a aplicar
                </div>
                <Button size="sm" variant="secondary" onClick={() => router.push('/discover')}>
                  Descubrir creadores
                </Button>
              </div>
            )}
          </section>

          {/* ── Quick access discover ── */}
          <section>
            <div className="bg-gradient-to-r from-violet-600 to-violet-800 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-white font-bold mb-1">Busca el creador perfecto</div>
                <div className="text-violet-200 text-sm">490+ creadores verificados disponibles en tu nicho</div>
              </div>
              <Link href="/discover">
                <Button variant="outline" size="sm" className="border-white/40 text-white hover:bg-white/10 flex-shrink-0">
                  Descubrir <ChevronRight size={14} />
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
