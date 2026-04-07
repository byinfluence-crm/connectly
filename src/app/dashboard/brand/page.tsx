'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Zap, Users, TrendingUp, Clock, CheckCircle,
  XCircle, ChevronRight, MapPin, LogOut, Flame, Eye,
  FileText, MoreHorizontal, Star, MessageCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';
import { supabase, getApplicationsByBrand, updateApplicationStatus, getDelivery } from '@/lib/supabase';
import type { ApplicationWithCreator, CollabDelivery } from '@/lib/supabase';
import BrandReviewModal from '@/components/BrandReviewModal';

/* ─── MOCK DATA ─────────────────────────────────────────────────── */
const MOCK_COLLABS = [
  {
    id: 1, title: 'Foodie para reels de nueva carta de primavera', niche: 'Gastronomía',
    status: 'active' as const, applicants: 7, views: 134, deadline: '30 abr',
    budget: null, type: 'Canje', created: '12 abr',
  },
  {
    id: 2, title: 'Campaña de redes para apertura de segunda tienda', niche: 'Moda',
    status: 'draft' as const, applicants: 0, views: 0, deadline: '20 may',
    budget: 400, type: 'Pago', created: '15 abr',
  },
  {
    id: 3, title: 'Embajador para línea de productos ecológicos', niche: 'Bienestar',
    status: 'closed' as const, applicants: 19, views: 312, deadline: '1 abr',
    budget: 200, type: 'Ambos', created: '10 mar',
  },
];

const MOCK_CANDIDATES = [
  {
    id: 1, name: 'Laura Sánchez', handle: '@laurastyle', niche: 'Moda', city: 'Madrid',
    followers: 48200, er: 4.2, rating: 4.9, collab: 'Campaña apertura tienda',
    status: 'pending' as const, appliedAt: 'hace 2h',
    img: 'https://picsum.photos/seed/laura-s/80/80',
  },
  {
    id: 2, name: 'Ana Martín', handle: '@anafit', niche: 'Fitness', city: 'Barcelona',
    followers: 91000, er: 3.8, rating: 4.7, collab: 'Foodie reels carta primavera',
    status: 'pending' as const, appliedAt: 'hace 5h',
    img: 'https://picsum.photos/seed/ana-m/80/80',
  },
  {
    id: 3, name: 'Marta Vega', handle: '@martawellness', niche: 'Bienestar', city: 'Málaga',
    followers: 18300, er: 7.4, rating: 4.9, collab: 'Foodie reels carta primavera',
    status: 'accepted' as const, appliedAt: 'hace 1d',
    img: 'https://picsum.photos/seed/marta-v/80/80',
  },
  {
    id: 4, name: 'Elena Castro', handle: '@elenabeauty', niche: 'Belleza', city: 'Madrid',
    followers: 29800, er: 5.8, rating: 4.8, collab: 'Foodie reels carta primavera',
    status: 'rejected' as const, appliedAt: 'hace 2d',
    img: 'https://picsum.photos/seed/elena-c/80/80',
  },
];

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

function formatK(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);
}

/* ─── SIDEBAR ───────────────────────────────────────────────────── */
function Sidebar({ displayName, onLogout }: { displayName: string; onLogout: () => void }) {
  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen fixed top-0 left-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-gray-900 tracking-tight">Connectly</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <NavItem href="/dashboard/brand" icon={<TrendingUp size={16} />} label="Inicio" active />
        <NavItem href="/discover" icon={<Search size={16} />} label="Descubrir creadores" />
        <NavItem href="/dashboard/brand/collabs" icon={<FileText size={16} />} label="Mis colaboraciones" />
        <NavItem href="/dashboard/brand/candidates" icon={<Users size={16} />} label="Candidatos" badge={2} />
        <NavItem href="/dashboard/brand/analytics" icon={<Zap size={16} />} label="Analytics" />
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900 truncate">{displayName}</div>
            <div className="text-xs text-gray-400">Marca</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs text-red-500 hover:text-red-700 transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-red-50"
        >
          <LogOut size={13} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href, icon, label, active, badge,
}: { href: string; icon: React.ReactNode; label: string; active?: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span className={active ? 'text-violet-600' : 'text-gray-400'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="bg-violet-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
    </Link>
  );
}

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
  const credits = 20; // mock — useCredits cuando haya plan Stripe

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

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

  // Usar datos reales si hay, si no mock para demo visual
  const showMockCandidates = !loadingApps && applications.length === 0;
  const pending = applications.filter(a => a.status === 'pending').length +
    (showMockCandidates ? MOCK_CANDIDATES.filter(c => c.status === 'pending').length : 0);
  const pendingReviews = applications.filter(
    a => a.status === 'accepted' && a.collab_status === 'pending_brand_review'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {reviewState && user && (
        <BrandReviewModal
          applicationId={reviewState.app.id}
          brandId={user.id}
          influencerId={reviewState.app.creator_id}
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
      <Sidebar displayName={displayName} onLogout={handleLogout} />

      {/* Main content — offset for sidebar on desktop */}
      <main className="lg:ml-60">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">Connectly</span>
          </Link>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>

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
              value={MOCK_COLLABS.filter(c => c.status === 'active').length}
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
              label="Créditos disponibles"
              value={credits}
              bg="bg-violet-50"
            />
            <StatCard
              icon={<Eye size={18} className="text-emerald-600" />}
              label="Vistas totales"
              value={MOCK_COLLABS.reduce((s, c) => s + c.views, 0)}
              bg="bg-emerald-50"
            />
          </div>

          {/* ── Mis colaboraciones ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Mis colaboraciones</h2>
              <Link href="/discover" className="text-xs text-violet-600 font-semibold flex items-center gap-1 hover:text-violet-700">
                Descubrir creadores <ChevronRight size={13} />
              </Link>
            </div>

            <div className="space-y-3">
              {MOCK_COLLABS.map(collab => (
                <div
                  key={collab.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 truncate">{collab.title}</span>
                      <Badge variant={STATUS_LABELS[collab.status].variant} size="sm">
                        {STATUS_LABELS[collab.status].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users size={11} />{collab.applicants} solicitudes</span>
                      <span className="flex items-center gap-1"><Eye size={11} />{collab.views} vistas</span>
                      <span>Hasta {collab.deadline}</span>
                    </div>
                  </div>
                  <button className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              ))}

              <button className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm text-gray-400 hover:border-violet-300 hover:text-violet-600 transition-colors flex items-center justify-center gap-2 font-medium">
                <Plus size={16} /> Nueva colaboración
              </button>
            </div>
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
                          {app.creator?.niche && <span>{app.creator.niche}</span>}
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
                        {app.creator_id && (
                          <Link href={`/creators/${app.creator_id}`} className="flex-shrink-0">
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
                        {app.creator_id && (
                          <Link href={`/creators/${app.creator_id}`} className="flex-shrink-0">
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
      </main>
    </div>
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
