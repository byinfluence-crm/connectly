import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { Star, ArrowRight, Zap, Shield, MessageCircle, TrendingUp, Search, ChevronRight } from 'lucide-react';

const FEATURED_INFLUENCERS = [
  { name: 'Laura Sánchez', handle: '@laurastyle', niche: 'Moda', city: 'Madrid', followers: 48200, er: 4.2, priceMin: 150, priceMax: 400, verified: true },
  { name: 'Carlos Ruiz', handle: '@carlosfoodie', niche: 'Gastronomía', city: 'Sevilla', followers: 23500, er: 6.1, priceMin: 80, priceMax: 200, verified: true },
  { name: 'Ana Martín', handle: '@anafit', niche: 'Fitness', city: 'Barcelona', followers: 91000, er: 3.8, priceMin: 300, priceMax: 700, verified: false },
  { name: 'Sofía López', handle: '@sofiatravel', niche: 'Viajes', city: 'Valencia', followers: 34700, er: 5.3, priceMin: 120, priceMax: 350, verified: true },
];

const FEATURED_COLLABS = [
  { brand: 'Casa Nova', title: 'Buscan foodie para reels de nueva carta', niche: 'Gastronomía', city: 'Sevilla', type: 'Canje', boosted: true },
  { brand: 'Gymfit Studio', title: 'Campaña de lanzamiento app de fitness', niche: 'Fitness', city: 'Madrid', type: 'Pago', boosted: false },
  { brand: 'Krave Clothing', title: 'Colaboración de moda primavera-verano', niche: 'Moda', city: 'Barcelona', type: 'Ambos', boosted: true },
];

function formatK(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="primary" size="md" className="mb-6 inline-flex">
            <Zap size={12} className="text-violet-600" />
            El marketplace de influencer marketing
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
            Conecta marcas e
            <span className="bg-gradient-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent"> influencers </span>
            sin fricción
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            El lugar donde las mejores marcas encuentran a los creadores perfectos. Colaboraciones reales, trato directo, resultados medibles.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register?role=brand">
              <Button size="lg" className="shadow-lg shadow-violet-200">
                Soy una marca
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/register?role=influencer">
              <Button size="lg" variant="outline">
                Soy creador de contenido
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">1 mes gratis · Sin tarjeta de crédito</p>
        </div>

        {/* Stats */}
        <div className="max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[
            { label: 'Creadores activos', value: '2.400+' },
            { label: 'Colaboraciones', value: '8.100+' },
            { label: 'Marcas', value: '340+' },
          ].map(s => (
            <div key={s.label} className="text-center p-5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Tan fácil como Wallapop</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Sin intermediarios. Sin emails en frío. Sin esperas.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Search, step: '01', title: 'Descubre', desc: 'Navega colaboraciones activas o busca el influencer perfecto por nicho, ciudad y seguidores.', color: 'bg-violet-50 text-violet-600' },
              { icon: MessageCircle, step: '02', title: 'Conecta', desc: 'Habla directamente. Sin intermediarios. Negocia condiciones y cierra el trato en el chat.', color: 'bg-emerald-50 text-emerald-600' },
              { icon: TrendingUp, step: '03', title: 'Crece', desc: 'Mide resultados, consigue reviews y construye tu reputación en la plataforma.', color: 'bg-amber-50 text-amber-600' },
            ].map(({ icon: Icon, step, title, desc, color }) => (
              <div key={step} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-bold text-gray-300 tracking-widest">{step}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INFLUENCERS DESTACADOS */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Creadores destacados</h2>
              <p className="text-gray-500 mt-1">Perfiles verificados listos para colaborar</p>
            </div>
            <Link href="/discover" className="hidden sm:flex items-center gap-1 text-sm text-violet-600 font-semibold hover:text-violet-700">
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURED_INFLUENCERS.map((inf) => (
              <Link
                key={inf.handle}
                href="/discover"
                className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-violet-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <Avatar name={inf.name} size="lg" />
                  {inf.verified && (
                    <Badge variant="primary" size="sm">
                      <Shield size={10} /> Pro
                    </Badge>
                  )}
                </div>
                <div className="font-semibold text-gray-900 text-sm group-hover:text-violet-700 transition-colors">{inf.name}</div>
                <div className="text-xs text-gray-400 mb-3">{inf.handle}</div>
                <Badge variant="default" size="sm" className="mb-3">{inf.niche}</Badge>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="font-bold text-gray-900">{formatK(inf.followers)}</div>
                    <div className="text-gray-400">Seguidores</div>
                  </div>
                  <div>
                    <div className="font-bold text-emerald-600">{inf.er}%</div>
                    <div className="text-gray-400">Engagement</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
                  💰 {inf.priceMin}€ – {inf.priceMax}€
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* COLABORACIONES ACTIVAS */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Colaboraciones abiertas</h2>
              <p className="text-gray-500 mt-1">Marcas buscando creadores ahora mismo</p>
            </div>
            <Link href="/discover?tab=collabs" className="hidden sm:flex items-center gap-1 text-sm text-violet-600 font-semibold hover:text-violet-700">
              Ver todas <ChevronRight size={16} />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {FEATURED_COLLABS.map((c) => (
              <div
                key={c.title}
                className={`bg-white rounded-2xl border p-5 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer ${c.boosted ? 'border-violet-200 ring-1 ring-violet-100' : 'border-gray-100'}`}
              >
                <Avatar name={c.brand} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{c.title}</span>
                    {c.boosted && <Badge variant="primary" size="sm"><Zap size={10} /> Destacado</Badge>}
                  </div>
                  <div className="text-xs text-gray-400">{c.brand} · {c.city}</div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Badge variant={c.type === 'Pago' ? 'success' : c.type === 'Canje' ? 'warning' : 'primary'} size="sm">{c.type}</Badge>
                  <Badge variant="default" size="sm">{c.niche}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARA QUIÉN ES */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-3xl p-8 text-white">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
              <TrendingUp size={22} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Para marcas</h3>
            <p className="text-violet-200 text-sm leading-relaxed mb-6">
              Publica tu colaboración en minutos y recibe solicitudes de creadores alineados con tu nicho. Sin agencias, sin comisiones ocultas.
            </p>
            <ul className="space-y-2 mb-8">
              {['Acceso a 2.400+ creadores verificados', 'Chat directo sin intermediarios', 'Boost para más visibilidad', 'Métricas y resultados reales'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-violet-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-300 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register?role=brand">
              <button className="bg-white text-violet-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-violet-50 transition-colors flex items-center gap-2">
                Publicar colaboración <ArrowRight size={15} />
              </button>
            </Link>
          </div>

          <div className="bg-gray-900 rounded-3xl p-8 text-white">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
              <Star size={22} className="text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Para creadores</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Recibe propuestas de marcas que se alinean con tu contenido. Tú decides. Tú negocias. Sin depender de nadie.
            </p>
            <ul className="space-y-2 mb-8">
              {['Perfil público con tu portfolio', 'Recibe ofertas directas de marcas', 'Chat y contratos en un solo lugar', 'Reviews que construyen reputación'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register?role=influencer">
              <button className="bg-amber-400 text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-amber-300 transition-colors flex items-center gap-2">
                Crear mi perfil gratis <ArrowRight size={15} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Lo que dicen nuestros usuarios</h2>
          <div className="flex items-center justify-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
            <span className="text-gray-600 text-sm ml-2 font-medium">4.9 / 5</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4">
          {[
            { name: 'Marta V.', role: 'Restaurante La Huerta', text: 'En 48h teníamos 12 solicitudes de influencers locales. Cerramos 3 colaboraciones ese mismo mes.' },
            { name: 'Diego F.', role: 'Creador @diegofit', text: 'Por fin una plataforma donde las marcas me buscan a mí. Llevo 6 colaboraciones en 2 meses.' },
            { name: 'Carla R.', role: 'Agencia Impulso', text: 'Gestiono 5 clientes desde Connectly. Antes tardaba semanas en montar una campaña.' },
          ].map((r) => (
            <div key={r.name} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>
              <div className="flex items-center gap-2">
                <Avatar name={r.name} size="sm" />
                <div>
                  <div className="text-xs font-semibold text-gray-900">{r.name}</div>
                  <div className="text-xs text-gray-400">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Empieza hoy. El primer mes es gratis.
          </h2>
          <p className="text-gray-500 text-lg mb-10">Sin tarjeta de crédito. Sin compromisos. Cancela cuando quieras.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="shadow-lg shadow-violet-200">
                Crear cuenta gratis <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">Ver planes y precios</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-bold text-gray-900">Connectly</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <Link href="/blog" className="hover:text-gray-600">Blog</Link>
            <Link href="/privacy" className="hover:text-gray-600">Privacidad</Link>
            <Link href="/terms" className="hover:text-gray-600">Términos</Link>
            <Link href="/contact" className="hover:text-gray-600">Contacto</Link>
          </div>
          <p className="text-xs text-gray-400">© 2025 Connectly · by Byinfluence</p>
        </div>
      </footer>
    </div>
  );
}
