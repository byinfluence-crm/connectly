'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, TrendingUp, Clock, CheckCircle, ChevronRight,
  MapPin, Flame, LogOut, FileText, User, Send,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';
import { supabase, getApplicationsByCreator } from '@/lib/supabase';
import type { ApplicationWithCollab } from '@/lib/supabase';

/* ─── MOCK DATA ─────────────────────────────────────────────────── */
const MOCK_APPLICATIONS = [
  {
    id: 1, brand: 'Casa Nova', title: 'Foodie para reels de nueva carta de primavera',
    status: 'accepted' as const, appliedAt: 'hace 3d', budget: null, type: 'Canje',
    logo: 'https://picsum.photos/seed/casanova/80/80',
  },
  {
    id: 2, brand: 'Gymfit Studio', title: 'Campaña de lanzamiento de app de fitness',
    status: 'pending' as const, appliedAt: 'hace 1d', budget: 300, type: 'Pago',
    logo: 'https://picsum.photos/seed/gymfit/80/80',
  },
  {
    id: 3, brand: 'SkinGlow', title: 'Embajadora para nueva gama de hidratantes premium',
    status: 'pending' as const, appliedAt: 'hace 5h', budget: 250, type: 'Pago',
    logo: 'https://picsum.photos/seed/skinglow-beauty/80/80',
  },
  {
    id: 4, brand: 'Krave Clothing', title: 'Colección PV · perfil de moda urbana',
    status: 'rejected' as const, appliedAt: 'hace 5d', budget: 200, type: 'Ambos',
    logo: 'https://picsum.photos/seed/krave-clothing/80/80',
  },
];

const MOCK_AVAILABLE = [
  {
    id: 1, brand: 'Naturalia Bio', title: 'Embajadores de bienestar para línea eco', niche: 'Bienestar',
    city: 'Remoto', type: 'Pago', budget: 150, boosted: false, applicants: 5, deadline: '10 may',
    cover: 'https://picsum.photos/seed/naturalia-eco/600/400',
  },
  {
    id: 2, brand: 'FoodLab', title: 'Creador de contenido gastronómico para RRSS', niche: 'Gastronomía',
    city: 'Sevilla', type: 'Canje', budget: null, boosted: true, applicants: 3, deadline: '25 abr',
    cover: 'https://picsum.photos/seed/foodlab-rest/600/400',
  },
  {
    id: 3, brand: 'ActiveWear', title: 'Influencer fitness para campaña de verano', niche: 'Fitness',
    city: 'Remoto', type: 'Pago', budget: 350, boosted: false, applicants: 11, deadline: '1 may',
    cover: 'https://picsum.photos/seed/active-sport/600/400',
  },
];

const APP_STATUS = {
  pending:  { label: 'En espera', variant: 'warning' as const },
  accepted: { label: 'Aceptada', variant: 'success' as const },
  rejected: { label: 'Rechazada', variant: 'danger' as const },
};

/* ─── SIDEBAR ───────────────────────────────────────────────────── */
function Sidebar({ displayName, userId, onLogout }: { displayName: string; userId: string | undefined; onLogout: () => void }) {
  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen fixed top-0 left-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-gray-900 tracking-tight">Connectly</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <NavItem href="/dashboard/creator" icon={<TrendingUp size={16} />} label="Inicio" active />
        <NavItem href="/discover" icon={<Search size={16} />} label="Buscar colaboraciones" />
        <NavItem href="/dashboard/creator/applications" icon={<FileText size={16} />} label="Mis aplicaciones" badge={2} />
        <NavItem href={userId ? `/creators/${userId}` : '/discover'} icon={<User size={16} />} label="Mi perfil público" />
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900 truncate">{displayName}</div>
            <div className="text-xs text-gray-400">Creador</div>
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
export default function CreatorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithCollab[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const displayName = (user?.user_metadata?.display_name as string) ?? 'Creador';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Cargar aplicaciones reales desde Supabase
  useEffect(() => {
    if (!user?.id) return;
    getApplicationsByCreator(user.id)
      .then(setApplications)
      .catch(console.error)
      .finally(() => setLoadingApps(false));
  }, [user?.id]);

  const totalSent = applications.length;
  const accepted = applications.filter(a => a.status === 'accepted').length;
  const pending = applications.filter(a => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar displayName={displayName} userId={user?.id} onLogout={handleLogout} />

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_AVAILABLE.map(c => (
                <div
                  key={c.id}
                  className={`bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                    c.boosted ? 'border-violet-200 ring-2 ring-violet-50' : 'border-gray-100'
                  }`}
                >
                  <div className="relative h-32 overflow-hidden">
                    <img src={c.cover} alt={c.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    {c.boosted && (
                      <span className="absolute top-2 left-2 flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        <Flame size={9} fill="white" /> Destacada
                      </span>
                    )}
                    <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                      c.type === 'Pago' ? 'bg-emerald-500 text-white' : c.type === 'Canje' ? 'bg-amber-500 text-white' : 'bg-violet-600 text-white'
                    }`}>
                      {c.type}{c.budget ? ` · ${c.budget}€` : ''}
                    </span>
                    <div className="absolute bottom-2 left-3">
                      <div className="text-white text-xs font-bold">{c.brand}</div>
                      <div className="flex items-center gap-1 text-white/70 text-xs">
                        <MapPin size={9} />{c.city}
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2 mb-2">{c.title}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Hasta {c.deadline}</span>
                      <Button size="sm" variant="secondary" className="text-xs py-1 px-3">
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                      {app.collab?.brand?.display_name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {app.collab?.brand?.display_name ?? 'Marca'}
                        </span>
                        <Badge variant={APP_STATUS[app.status].variant} size="sm">
                          {APP_STATUS[app.status].label}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 truncate">{app.collab?.title ?? '—'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {app.collab?.type}{app.collab?.budget ? ` · ${app.collab.budget}€` : ''}
                      </div>
                    </div>
                    {app.status === 'accepted' && (
                      <Link href={`/chat/${app.id}`}>
                        <Button size="sm" variant="secondary" className="flex-shrink-0 text-xs">
                          Chat
                        </Button>
                      </Link>
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
