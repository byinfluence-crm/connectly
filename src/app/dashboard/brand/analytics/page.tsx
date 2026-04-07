'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, TrendingUp, Users, Star, BarChart3, LogOut, ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar,
} from 'recharts';
import { useAuth } from '@/components/AuthProvider';
import { supabase, getBrandAnalytics } from '@/lib/supabase';

// ─── Mock ─────────────────────────────────────────────────────────────────────

function buildMockMonthly() {
  const months = ['Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr'];
  return months.map((m, i) => ({
    month: m,
    campañas: [0, 1, 0, 1, 2, 2][i],
    alcance: [0, 12400, 0, 19800, 34200, 41600][i],
    interacciones: [0, 980, 0, 1640, 2910, 3720][i],
  }));
}

const MOCK_TOP_INFLUENCERS = [
  { name: 'Laura Sánchez', niche: 'Moda', collabs: 3, reach: 41200, er: 9.1, rating: 5.0, id: 'mock-1' },
  { name: 'Marta Vega', niche: 'Bienestar', collabs: 2, reach: 24800, er: 7.8, rating: 4.9, id: 'mock-2' },
  { name: 'Carlos Ruiz', niche: 'Gastronomía', collabs: 1, reach: 18400, er: 8.3, rating: 5.0, id: 'mock-3' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split('-');
  const names = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${names[parseInt(m)]} ${y.slice(2)}`;
}

function StatCard({
  icon, label, value, sub, color = 'violet',
}: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string }) {
  const bg: Record<string, string> = {
    violet: 'bg-violet-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50', blue: 'bg-blue-50',
  };
  return (
    <div className={`${bg[color]} rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2 text-gray-500">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: 'white', border: '1px solid #f3f4f6',
  borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BrandAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  type BrandData = Awaited<ReturnType<typeof getBrandAnalytics>>;
  const [data, setData] = useState<BrandData>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'alcance' | 'interacciones'>('alcance');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.id) return;
    getBrandAnalytics(user.id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const displayName = (user?.user_metadata?.display_name as string) ?? 'Mi Marca';

  // Calcular totales desde datos reales
  const completed = data.filter(d => d.collab_status === 'completed');
  const totalReach = completed.reduce((s, d) => s + (d.delivery?.reach ?? 0), 0);
  const totalInteractions = completed.reduce((s, d) => s + (d.delivery?.interactions ?? 0), 0);
  const avgER = totalReach > 0 ? ((totalInteractions / totalReach) * 100).toFixed(1) : null;

  // Mensuales
  const monthlyData = (() => {
    if (completed.length === 0) return buildMockMonthly();
    const map = new Map<string, { campañas: number; alcance: number; interacciones: number }>();
    for (const d of completed) {
      const ym = (d.delivery?.submitted_at ?? d.created_at).slice(0, 7);
      const ex = map.get(ym) ?? { campañas: 0, alcance: 0, interacciones: 0 };
      ex.campañas++;
      ex.alcance += d.delivery?.reach ?? 0;
      ex.interacciones += d.delivery?.interactions ?? 0;
      map.set(ym, ex);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([ym, v]) => ({ month: fmtMonth(ym), ...v }));
  })();

  // Top influencers
  const topInfluencers = (() => {
    if (completed.length === 0) return MOCK_TOP_INFLUENCERS;
    const map = new Map<string, { name: string; niche: string | null; collabs: number; reach: number; interactions: number; id: string }>();
    for (const d of completed) {
      const key = d.creator_id;
      const ex = map.get(key) ?? {
        name: d.creator?.display_name ?? 'Creador',
        niche: d.creator?.niche ?? null,
        collabs: 0, reach: 0, interactions: 0, id: d.creator_id,
      };
      ex.collabs++;
      ex.reach += d.delivery?.reach ?? 0;
      ex.interactions += d.delivery?.interactions ?? 0;
      map.set(key, ex);
    }
    return Array.from(map.values())
      .sort((a, b) => b.reach - a.reach)
      .slice(0, 5)
      .map(v => ({
        ...v,
        er: v.reach > 0 ? parseFloat(((v.interactions / v.reach) * 100).toFixed(1)) : 0,
        rating: 4.8, // real: query a reviews
      }));
  })();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard/brand" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <span className="text-sm font-bold text-gray-900 flex-1">Analytics de campaña</span>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        <div>
          <h1 className="text-xl font-bold text-gray-900">Rendimiento de tus campañas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {completed.length > 0
              ? `${completed.length} colaboraciones completadas`
              : 'Datos de ejemplo — se actualizarán con tus primeras campañas'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<BarChart3 size={16} className="text-violet-600" />}
            label="Campañas completadas"
            value={completed.length > 0 ? String(completed.length) : '18'}
            color="violet"
          />
          <StatCard
            icon={<Users size={16} className="text-blue-600" />}
            label="Alcance total"
            value={totalReach > 0 ? fmt(totalReach) : '148.4K'}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp size={16} className="text-emerald-600" />}
            label="Engagement rate"
            value={avgER ?? '8.7%'}
            sub="Media ponderada"
            color="emerald"
          />
          <StatCard
            icon={<Star size={16} className="text-amber-600" />}
            label="Rating medio creadores"
            value="4.8 ★"
            sub="12 reseñas emitidas"
            color="amber"
          />
        </div>

        {/* Gráfico */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-sm font-bold text-gray-900">Rendimiento mensual</h2>
            <div className="flex gap-1.5">
              {(['alcance', 'interacciones'] as const).map(k => (
                <button
                  key={k}
                  onClick={() => setActiveChart(k)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeChart === k ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f9fafb" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={v => fmt(v)} width={45} />
              <Tooltip contentStyle={TOOLTIP_STYLE}
                formatter={(v: unknown) => [fmt(Number(v)), activeChart === 'alcance' ? 'Alcance' : 'Interacciones']} />
              <Area type="monotone" dataKey={activeChart}
                stroke="#7c3aed" strokeWidth={2.5} fill="url(#brandGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Campañas por mes */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Campañas por mes</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f9fafb" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={20} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="campañas" name="Campañas" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top influencers */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Tus mejores creadores</h2>
            <Link href="/discover" className="text-xs text-violet-600 font-semibold flex items-center gap-1 hover:text-violet-700">
              Descubrir más <ChevronRight size={13} />
            </Link>
          </div>
          <div className="space-y-3">
            {topInfluencers.map((inf, i) => (
              <div key={inf.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{inf.name}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {inf.niche && <span>{inf.niche}</span>}
                    <span>{inf.collabs} collab{inf.collabs > 1 ? 's' : ''}</span>
                    <span className="text-emerald-600 font-medium">{inf.er}% ER</span>
                    <span>{'★'.repeat(Math.round(inf.rating))} {inf.rating}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-gray-700">{fmt(inf.reach)}</div>
                  <div className="text-[10px] text-gray-400">alcance</div>
                </div>
                <Link href={`/creators/${inf.id}`} className="flex-shrink-0">
                  <button className="text-xs text-violet-600 font-semibold bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition-colors">
                    Contactar
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
