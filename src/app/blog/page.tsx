import Link from 'next/link';
import { ArrowLeft, ArrowRight, TrendingUp, Star, Users, Zap } from 'lucide-react';

export const metadata = { title: 'Blog y casos de éxito — Connectly' };

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURED = {
  slug: 'restaurante-elena-reel-viral',
  category: 'Caso de éxito',
  categoryColor: 'bg-violet-100 text-violet-700',
  title: 'Cómo un restaurante de Madrid consiguió 280K visualizaciones con un solo reel',
  excerpt: 'Elena García, propietaria de Taberna del Sur, publicó una colaboración de canje en Connectly un martes por la tarde. El viernes siguiente tenía lista de espera para el fin de semana.',
  author: 'Equipo Connectly',
  date: 'marzo 2026',
  readTime: '4 min',
  img: 'https://picsum.photos/seed/blog-featured/800/420',
  stats: [
    { label: 'Visualizaciones', value: '280K', icon: <TrendingUp size={14} /> },
    { label: 'Reservas nuevas', value: '+63', icon: <Users size={14} /> },
    { label: 'ROI estimado', value: '×9', icon: <Zap size={14} /> },
  ],
};

const POSTS = [
  {
    slug: 'marca-cosmetica-10-influencers',
    category: 'Caso de éxito',
    categoryColor: 'bg-violet-100 text-violet-700',
    title: '10 micro-influencers, 1 lanzamiento de producto y 48h de stock agotado',
    excerpt: 'Lumina Beauty coordinó 10 campañas simultáneas con creadoras de belleza de entre 8K y 40K seguidores. El resultado superó cualquier campaña con macro-influencers anterior.',
    author: 'Equipo Connectly',
    date: 'feb 2026',
    readTime: '5 min',
    img: 'https://picsum.photos/seed/blog-cosmetica/600/340',
    stats: { label: 'Alcance total', value: '312K' },
  },
  {
    slug: 'gym-local-barcelona',
    category: 'Caso de éxito',
    categoryColor: 'bg-violet-100 text-violet-700',
    title: 'Un gimnasio local en Barcelona dobló sus altas en enero con 3 colaboraciones de canje',
    excerpt: 'Sin presupuesto en efectivo, el equipo de FitSpace Barcelona ofreció mensualidades a tres creadoras de fitness. En cuatro semanas tenían 89 nuevas altas directamente atribuidas.',
    author: 'Equipo Connectly',
    date: 'ene 2026',
    readTime: '3 min',
    img: 'https://picsum.photos/seed/blog-gym/600/340',
    stats: { label: 'Nuevas altas', value: '89' },
  },
  {
    slug: 'guia-micro-influencers-2026',
    category: 'Guía',
    categoryColor: 'bg-blue-100 text-blue-700',
    title: 'Por qué los micro-influencers generan mejor ROI que los macro en 2026',
    excerpt: 'Los datos de más de 400 campañas en Connectly revelan una verdad incómoda para las grandes agencias: el engagement rate medio de los cuentas de 10K-50K seguidores triplica al de los de más de 500K.',
    author: 'Equipo Connectly',
    date: 'ene 2026',
    readTime: '6 min',
    img: 'https://picsum.photos/seed/blog-micro/600/340',
    stats: { label: 'ER medio', value: '8.4%' },
  },
  {
    slug: 'tienda-moda-sevilla',
    category: 'Caso de éxito',
    categoryColor: 'bg-violet-100 text-violet-700',
    title: 'De tienda local a marca conocida en Andalucía: el caso de Atelier Sevilla',
    excerpt: 'Durante seis meses, Atelier Sevilla activó campañas mensuales con creadoras de moda de Sevilla, Málaga y Cádiz. Su cuenta de Instagram creció un 340% y las ventas online superaron por primera vez a las físicas.',
    author: 'Equipo Connectly',
    date: 'dic 2025',
    readTime: '4 min',
    img: 'https://picsum.photos/seed/blog-moda/600/340',
    stats: { label: 'Crecimiento IG', value: '+340%' },
  },
  {
    slug: 'negociar-canje-producto',
    category: 'Consejos',
    categoryColor: 'bg-emerald-100 text-emerald-700',
    title: 'Cómo negociar un canje de producto que sea justo para ambas partes',
    excerpt: 'El canje es la forma de colaboración más extendida, pero también la que más malentendidos genera. Te explicamos qué incluir en el briefing, cómo valorar el producto y qué esperar del creador.',
    author: 'Equipo Connectly',
    date: 'nov 2025',
    readTime: '5 min',
    img: 'https://picsum.photos/seed/blog-canje/600/340',
    stats: { label: 'Consejos prácticos', value: '12' },
  },
  {
    slug: 'hotel-boutique-valencia',
    category: 'Caso de éxito',
    categoryColor: 'bg-violet-100 text-violet-700',
    title: 'El hotel boutique de Valencia que llenó su temporada baja con travel creators',
    excerpt: 'Casa Levante tenía un problema clásico: noviembre y febrero siempre con baja ocupación. Tres campañas con travel creators y food bloggers después, esos meses pasaron a ser los más rentables del año.',
    author: 'Equipo Connectly',
    date: 'oct 2025',
    readTime: '4 min',
    img: 'https://picsum.photos/seed/blog-hotel/600/340',
    stats: { label: 'Ocupación media', value: '+58%' },
  },
];

const CATEGORIES = ['Todos', 'Casos de éxito', 'Guías', 'Consejos', 'Tendencias'];

// ─── Components ───────────────────────────────────────────────────────────────

function CategoryBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar mínima */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center">
            <img src="/logo-horizontal.svg" alt="Connectly" className="h-6 w-auto" />
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">Blog</span>
          <div className="flex-1" />
          <Link href="/register">
            <button className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors">
              Empezar gratis
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Casos de éxito y recursos</h1>
          <p className="text-gray-500">Campañas reales, datos reales. Aprende cómo marcas como la tuya crecen con Connectly.</p>
        </div>

        {/* Featured */}
        <Link href={`/blog/${FEATURED.slug}`} className="block group">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={FEATURED.img}
                alt={FEATURED.title}
                className="w-full h-56 sm:h-72 object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <CategoryBadge label={FEATURED.category} color={FEATURED.categoryColor} />
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">
                {FEATURED.title}
              </h2>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">{FEATURED.excerpt}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {FEATURED.stats.map(s => (
                  <div key={s.label} className="bg-violet-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-violet-600 mb-1">{s.icon}</div>
                    <div className="text-lg font-bold text-gray-900">{s.value}</div>
                    <div className="text-[10px] text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">{FEATURED.author} · {FEATURED.date} · {FEATURED.readTime} lectura</div>
                <span className="flex items-center gap-1 text-xs text-violet-600 font-semibold group-hover:gap-2 transition-all">
                  Leer caso <ArrowRight size={13} />
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Grid */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4">Más casos y recursos</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POSTS.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all overflow-hidden">
                <div className="relative">
                  <img
                    src={post.img}
                    alt={post.title}
                    className="w-full h-40 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <CategoryBadge label={post.category} color={post.categoryColor} />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {post.stats.value} {post.stats.label}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5 leading-snug group-hover:text-violet-700 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{post.date} · {post.readTime}</span>
                    <span className="text-[10px] text-violet-600 font-semibold flex items-center gap-0.5">
                      Leer <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-3xl p-8 text-center text-white">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="white" className="text-white" />)}
          </div>
          <h2 className="text-xl font-bold mb-2">¿Quieres ser el próximo caso de éxito?</h2>
          <p className="text-violet-200 text-sm mb-6 max-w-md mx-auto">
            Más de 490 creadores verificados esperan tu campaña. Publica gratis y recibe candidaturas en menos de 24h.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/register?role=brand">
              <button className="px-6 py-3 rounded-xl bg-white text-violet-700 text-sm font-bold hover:bg-violet-50 transition-colors">
                Soy una marca
              </button>
            </Link>
            <Link href="/register?role=creator">
              <button className="px-6 py-3 rounded-xl border border-violet-400 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
                Soy creador/a
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
