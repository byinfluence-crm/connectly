'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, TrendingUp, Users, Star, BarChart3, Zap,
  ChevronRight, ExternalLink, AlertCircle, CheckCircle,
  LogOut, Award,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Legend,
} from 'recharts';
import { useAuth } from '@/components/AuthProvider';
import { supabase, getInfluencerDeliveries, getReviewsForCreator } from '@/lib/supabase';
import type { Review } from '@/lib/supabase';

// ─── Mock data (fallback cuando no hay datos reales) ─────────────────────────

function buildMockMonthly() {
  const months = ['Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr'];
  return months.map((m, i) => ({
    month: m,
    collabs: [0, 1, 1, 2, 2, 3][i],
    alcance: [0, 4200, 8100, 14300, 18900, 24100][i],
    interacciones: [0, 380, 710, 1240, 1620, 2150][i],
    er: [0, 9.0, 8.8, 8.7, 8.6, 8.9][i],
  }));
}

const MOCK_SCORE = 74;
const MOCK_BENCHMARK = 73;

const CONTENT_BREAKDOWN = [
  { type: 'Reel', collabs: 8, alcance: 41200, er: 9.1 },
  { type: 'Post', collabs: 5, alcance: 18400, er: 6.3 },
  { type: 'Story', collabs: 11, alcance: 24800, er: 7.8 },
  { type: 'TikTok', collabs: 2, alcance: 9200, er: 12.4 },
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

function ScoreArc({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ * 0.75; // 3/4 of circle
  const color = score >= 70 ? '#7c3aed' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="140" height="100" viewBox="0 0 140 100">
      <circle cx="70" cy="80" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12"
        strokeDasharray={`${circ * 0.75} ${circ}`} strokeDashoffset="0"
        strokeLinecap="round" transform="rotate(135 70 80)" />
      <circle cx="70" cy="80" r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${filled} ${circ}`} strokeDashoffset="0"
        strokeLinecap="round" transform="rotate(135 70 80)"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="70" y="76" textAnchor="middle" fontSize="26" fontWeight="800" fill={color}>{score}</text>
      <text x="70" y="94" textAnchor="middle" fontSize="9" fill="#9ca3af">/ 100</text>
    </svg>
  );
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
  backgroundColor: 'white',
  border: '1px solid #f3f4f6',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CreatorAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [deliveries, setDeliveries] = useState<Awaited<ReturnType<typeof getInfluencerDeliveries>>>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'alcance' | 'interacciones' | 'er'>('alcance');
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getInfluencerDeliveries(user.id),
      getReviewsForCreator(user.id),
    ])
      .then(([d, r]) => { setDeliveries(d); setReviews(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const displayName = (user?.user_metadata?.display_name as string) ?? 'Creador';

  // Calcular totales desde entregas reales
  const totalCollabs = deliveries.length;
  const totalReach = deliveries.reduce((s, d) => s + (d.reach ?? 0), 0);
  const totalInteractions = deliveries.reduce((s, d) => s + (d.interactions ?? 0), 0);
  const avgER = totalReach > 0 ? ((totalInteractions / totalReach) * 100).toFixed(1) : '—';
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  // Construir datos mensuales desde entregas reales
  const monthlyData = (() => {
    if (deliveries.length === 0) return buildMockMonthly();
    const map = new Map<string, { collabs: number; alcance: number; interacciones: number; er: number }>();
    for (const d of deliveries) {
      const ym = d.submitted_at.slice(0, 7);
      const existing = map.get(ym) ?? { collabs: 0, alcance: 0, interacciones: 0, er: 0 };
      existing.collabs++;
      existing.alcance += d.reach ?? 0;
      existing.interacciones += d.interactions ?? 0;
      map.set(ym, existing);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([ym, v]) => ({
        month: fmtMonth(ym),
        collabs: v.collabs,
        alcance: v.alcance,
        interacciones: v.interacciones,
        er: v.alcance > 0 ? parseFloat(((v.interacciones / v.alcance) * 100).toFixed(1)) : 0,
      }));
  })();

  // Score (mock hasta que exista tabla influencer_scores)
  const score = MOCK_SCORE;
  const benchmark = MOCK_BENCHMARK;

  // Detección de áreas de mejora desde reseñas
  const improvementAreas = (() => {
    if (reviews.length < 2) return [];
    const areas = [];
    const avgComm = reviews.reduce((s, r) => s + (r.rating_communication ?? 0), 0) / reviews.length;
    const avgProf = reviews.reduce((s, r) => s + (r.rating_professionalism ?? 0), 0) / reviews.length;
    const avgResults = reviews.reduce((s, r) => s + (r.rating_results ?? 0), 0) / reviews.length;
    if (avgComm < 3.5) areas.push({ label: 'Comunicación con la marca', avg: avgComm });
    if (avgProf < 3.5) areas.push({ label: 'Puntualidad y profesionalidad', avg: avgProf });
    if (avgResults < 3.5) areas.push({ label: 'Resultados del contenido', avg: avgResults });
    return areas;
  })();

  // Filtro de entregas por mes
  const months = [...new Set(deliveries.map(d => d.submitted_at.slice(0, 7)))].sort().reverse();
  const filteredDeliveries = filterMonth
    ? deliveries.filter(d => d.submitted_at.startsWith(filterMonth))
    : deliveries;

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
          <Link href="/dashboard/creator" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <span className="text-sm font-bold text-gray-900 flex-1">Mis analytics</span>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* ── Cabecera ── */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Panel de rendimiento</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {deliveries.length > 0
              ? `Basado en ${deliveries.length} entregas reales`
              : 'Datos de ejemplo — se actualizarán con tus primeras colaboraciones'}
          </p>
        </div>

        {/* ── Stats resumen ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<BarChart3 size={16} className="text-violet-600" />}
            label="Colaboraciones"
            value={totalCollabs > 0 ? String(totalCollabs) : '26'}
            color="violet"
          />
          <StatCard
            icon={<Users size={16} className="text-blue-600" />}
            label="Alcance total"
            value={totalReach > 0 ? fmt(totalReach) : '74.2K'}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp size={16} className="text-emerald-600" />}
            label="Engagement rate"
            value={avgER !== '—' ? `${avgER}%` : '8.9%'}
            sub="Media ponderada"
            color="emerald"
          />
          <StatCard
            icon={<Star size={16} className="text-amber-600" />}
            label="Rating medio"
            value={avgRating !== '—' ? `${avgRating} ★` : '4.8 ★'}
            sub={reviews.length > 0 ? `${reviews.length} reseñas` : '12 reseñas'}
            color="amber"
          />
        </div>

        {/* ── Score Connectly ── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="text-center flex-shrink-0">
              <ScoreArc score={score} />
              <div className="text-xs font-bold text-gray-700 mt-1">Score Connectly</div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-3">
                <Award size={16} className="text-violet-600" />
                <span className="text-sm font-bold text-gray-900">Tu puntuación en la plataforma</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                El Score Connectly combina tu engagement rate, tus reseñas, tu puntualidad en entregas
                y tu tasa de colaboraciones completadas. Las marcas lo ven al buscarte.
              </p>
              {/* Benchmark */}
              <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3">
                <div className="text-sm font-bold text-violet-800 mb-1">
                  🏆 Estás por encima del {benchmark}% de creadores de tu nicho
                </div>
                <div className="text-xs text-violet-600">
                  Mantén un engagement alto y responde bien a los briefings para seguir subiendo.
                </div>
              </div>
              {/* Factores */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { label: 'Engagement', value: 88, color: 'bg-violet-500' },
                  { label: 'Reseñas', value: 96, color: 'bg-emerald-500' },
                  { label: 'Puntualidad', value: 72, color: 'bg-amber-500' },
                  { label: 'Completación', value: 80, color: 'bg-blue-500' },
                ].map(f => (
                  <div key={f.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{f.label}</span>
                      <span className="font-bold text-gray-700">{f.value}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Gráfico mensual ── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-sm font-bold text-gray-900">Rendimiento mensual</h2>
            <div className="flex gap-1.5">
              {(['alcance', 'interacciones', 'er'] as const).map(k => (
                <button
                  key={k}
                  onClick={() => setActiveChart(k)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeChart === k ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {k === 'alcance' ? 'Alcance' : k === 'interacciones' ? 'Interacciones' : 'ER %'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f9fafb" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={v => activeChart === 'er' ? `${v}%` : fmt(v)} width={45} />
              <Tooltip contentStyle={TOOLTIP_STYLE}
                formatter={(v: unknown) => [activeChart === 'er' ? `${v}%` : fmt(Number(v)), activeChart === 'alcance' ? 'Alcance' : activeChart === 'interacciones' ? 'Interacciones' : 'ER']} />
              <Area
                type="monotone" dataKey={activeChart}
                stroke="#7c3aed" strokeWidth={2.5} fill="url(#colorPrimary)" dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Colaboraciones por mes (barras) ── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Colaboraciones completadas por mes</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f9fafb" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={25} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="collabs" name="Colaboraciones" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Desglose por tipo de contenido ── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Por tipo de contenido</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-50">
                  <th className="text-left pb-3 font-medium">Formato</th>
                  <th className="text-right pb-3 font-medium">Colaboraciones</th>
                  <th className="text-right pb-3 font-medium">Alcance</th>
                  <th className="text-right pb-3 font-medium">ER medio</th>
                  <th className="text-right pb-3 font-medium">Mejor formato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {CONTENT_BREAKDOWN.map((c, i) => (
                  <tr key={c.type}>
                    <td className="py-3 font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-600 opacity-[{1 - i * 0.2}]" />
                      {c.type}
                    </td>
                    <td className="py-3 text-right text-gray-600">{c.collabs}</td>
                    <td className="py-3 text-right text-gray-600">{fmt(c.alcance)}</td>
                    <td className="py-3 text-right">
                      <span className={`font-bold ${c.er >= 9 ? 'text-emerald-600' : c.er >= 7 ? 'text-violet-600' : 'text-gray-600'}`}>
                        {c.er}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {i === 0 && <span className="text-xs bg-violet-50 text-violet-600 font-bold px-2 py-0.5 rounded-full">🏆 Top</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Reseñas recibidas + áreas de mejora ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Desglose de categorías */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Valoraciones por categoría</h2>
            {[
              { label: 'Comunicación', key: 'rating_communication' },
              { label: 'Profesionalidad', key: 'rating_professionalism' },
              { label: 'Resultados', key: 'rating_results' },
            ].map(cat => {
              const vals = reviews.map(r => (r as Review & Record<string, number>)[cat.key] ?? 0).filter(Boolean);
              const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 4.5;
              const pct = (avg / 5) * 100;
              return (
                <div key={cat.label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{cat.label}</span>
                    <span className="font-bold text-gray-800">{avg.toFixed(1)} / 5</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="mt-4 pt-3 border-t border-gray-50">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Repetiría contigo</span>
                <span className="font-bold text-emerald-600">
                  {reviews.length > 0
                    ? `${Math.round((reviews.filter(r => r.would_repeat).length / reviews.length) * 100)}%`
                    : '83%'}
                </span>
              </div>
            </div>
          </div>

          {/* Áreas de mejora */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Áreas de mejora</h2>
            {improvementAreas.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">¡Sin áreas críticas!</p>
                <p className="text-xs text-gray-400 mt-1">Las marcas están muy satisfechas con tu trabajo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {improvementAreas.map(a => (
                  <div key={a.label} className="flex items-start gap-2.5 bg-amber-50 rounded-xl p-3">
                    <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-gray-800">{a.label}</div>
                      <div className="text-xs text-amber-700">{a.avg.toFixed(1)} / 5 de media — por debajo del umbral</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Consejos fijos */}
            <div className="mt-4 space-y-2">
              {[
                'Confirma siempre la fecha de publicación antes de empezar',
                'Pregunta si el briefing tiene dudas — las marcas lo valoran',
                'Sube las estadísticas en las primeras 24h tras publicar',
              ].map(tip => (
                <div key={tip} className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="text-violet-400 font-bold mt-0.5">→</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Historial de entregas ── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-sm font-bold text-gray-900">Historial de entregas</h2>
            {months.length > 0 && (
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Todos los meses</option>
                {months.map(m => (
                  <option key={m} value={m}>{fmtMonth(m)}</option>
                ))}
              </select>
            )}
          </div>

          {filteredDeliveries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">📦</div>
              <p className="text-sm text-gray-500">Aún no hay entregas registradas.</p>
              <p className="text-xs text-gray-400 mt-1">Aparecerán aquí cuando completes colaboraciones.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-50">
                    <th className="text-left pb-3 font-medium">Marca / Colaboración</th>
                    <th className="text-right pb-3 font-medium">Alcance</th>
                    <th className="text-right pb-3 font-medium">Interacciones</th>
                    <th className="text-right pb-3 font-medium">ER</th>
                    <th className="text-right pb-3 font-medium">Fecha</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredDeliveries.map(d => {
                    const er = d.reach && d.interactions
                      ? ((d.interactions / d.reach) * 100).toFixed(1)
                      : '—';
                    return (
                      <tr key={d.id}>
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-gray-900 truncate max-w-[180px]">
                            {d.application?.brand?.display_name ?? '—'}
                          </div>
                          <div className="text-gray-400 truncate max-w-[180px]">
                            {d.application?.collab?.title ?? '—'}
                          </div>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {d.content_types.map((t, i) => (
                              <span key={i} className="bg-violet-50 text-violet-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 text-right text-gray-700 font-medium">{d.reach ? fmt(d.reach) : '—'}</td>
                        <td className="py-3 text-right text-gray-700">{d.interactions ? fmt(d.interactions) : '—'}</td>
                        <td className={`py-3 text-right font-bold ${Number(er) >= 7 ? 'text-emerald-600' : Number(er) >= 4 ? 'text-amber-600' : 'text-gray-500'}`}>
                          {er !== '—' ? `${er}%` : '—'}
                        </td>
                        <td className="py-3 text-right text-gray-400">
                          {new Date(d.submitted_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-3 pl-2">
                          {d.post_urls[0] && (
                            <a href={d.post_urls[0]} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 inline-block">
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── CTA al perfil público ── */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-800 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-bold mb-1">¿Cómo te ven las marcas?</div>
            <div className="text-violet-200 text-sm">Tu score y reseñas son públicos. Comparte tu perfil con marcas.</div>
          </div>
          <Link href={`/creators/${user?.id}`}>
            <button className="flex items-center gap-2 text-xs font-bold text-white border border-white/30 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors flex-shrink-0">
              Ver mi perfil <ChevronRight size={13} />
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
