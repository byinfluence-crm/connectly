'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Star, ArrowRight, Zap, Shield, MessageCircle, TrendingUp, Search, CheckCircle, Users, BarChart3 } from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURED_INFLUENCERS = [
  { name: 'Laura Sánchez', handle: '@laurastyle', niche: 'Moda', city: 'Madrid', followers: 48200, er: 4.2, priceMin: 150, priceMax: 400, verified: true, seed: 'laura-s' },
  { name: 'Carlos Ruiz', handle: '@carlosfoodie', niche: 'Gastronomía', city: 'Sevilla', followers: 23500, er: 6.1, priceMin: 80, priceMax: 200, verified: true, seed: 'carlos-r' },
  { name: 'Ana Martín', handle: '@anafit', niche: 'Fitness', city: 'Barcelona', followers: 91000, er: 3.8, priceMin: 300, priceMax: 700, verified: false, seed: 'ana-m' },
  { name: 'Sofía López', handle: '@sofiatravel', niche: 'Viajes', city: 'Valencia', followers: 34700, er: 5.3, priceMin: 120, priceMax: 350, verified: true, seed: 'sofia-l' },
];

const FEATURED_COLLABS = [
  { brand: 'Casa Nova', title: 'Buscan foodie para reels de nueva carta', niche: 'Gastronomía', city: 'Sevilla', type: 'Canje', boosted: true, seed: 'casanova' },
  { brand: 'Gymfit Studio', title: 'Campaña de lanzamiento app de fitness', niche: 'Fitness', city: 'Madrid', type: 'Pago', boosted: false, seed: 'gymfit' },
  { brand: 'Krave Clothing', title: 'Colaboración de moda primavera-verano', niche: 'Moda', city: 'Barcelona', type: 'Ambos', boosted: true, seed: 'krave' },
];

const REVIEWS = [
  { name: 'Marta V.', role: 'Restaurante La Huerta', text: 'En 48h teníamos 12 solicitudes de influencers locales. Cerramos 3 colaboraciones ese mismo mes.' },
  { name: 'Diego F.', role: 'Creador @diegofit', text: 'Por fin una plataforma donde las marcas me buscan a mí. Llevo 6 colaboraciones en 2 meses.' },
  { name: 'Carla R.', role: 'Agencia Impulso', text: 'Gestiono 5 clientes desde Connectly. Antes tardaba semanas en montar una campaña.' },
];

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
};

// ─── CountUp component ────────────────────────────────────────────────────────

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) motionVal.set(target);
  }, [inView, motionVal, target]);

  useEffect(() => {
    return spring.on('change', v => {
      setDisplay(v >= 1000
        ? (v / 1000).toFixed(1).replace('.', ',') + 'K'
        : Math.round(v).toString());
    });
  }, [spring]);

  return <span ref={ref}>{display}{suffix}</span>;
}

// ─── Floating orb ─────────────────────────────────────────────────────────────

function Orb({ className }: { className: string }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-30 pointer-events-none ${className}`}
      animate={{ scale: [1, 1.15, 1], x: [0, 20, -10, 0], y: [0, -15, 10, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtFollowers(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [reviewIdx, setReviewIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setReviewIdx(i => (i + 1) % REVIEWS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-purple-50" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #7c3aed 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <Orb className="w-96 h-96 bg-violet-400 top-0 right-0 translate-x-1/3 -translate-y-1/3" />
        <Orb className="w-64 h-64 bg-purple-300 bottom-1/4 left-0 -translate-x-1/2" />
        <Orb className="w-48 h-48 bg-violet-200 top-1/2 left-1/4" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-white border border-violet-100 text-violet-700 text-xs font-bold px-4 py-2 rounded-full shadow-sm mb-8"
          >
            <motion.span
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3 }}
            >
              ⚡
            </motion.span>
            La plataforma de influencer marketing más rápida de España
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[1.08] tracking-tight mb-6"
          >
            Conecta marcas con{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-500">
                influencers
              </span>
              <motion.svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9, ease: 'easeOut' }}
              >
                <motion.path
                  d="M0 8 Q75 2 150 8 Q225 14 300 8"
                  fill="none"
                  stroke="url(#grad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </motion.svg>
            </span>
            {' '}locales
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Publica tu campaña gratis, recibe propuestas de creadores verificados y gestiona todo desde un solo lugar.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register?role=brand">
                <button className="group px-7 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all flex items-center gap-2">
                  Soy una marca
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register?role=creator">
                <button className="px-7 py-4 rounded-2xl bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold hover:border-violet-300 hover:text-violet-700 transition-all">
                  Soy influencer
                </button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-16 flex flex-wrap gap-6 justify-center items-center text-sm text-gray-400"
          >
            <span>✓ Sin comisión en el primer mes</span>
            <span className="hidden sm:block w-px h-4 bg-gray-200" />
            <span>✓ Perfiles verificados</span>
            <span className="hidden sm:block w-px h-4 bg-gray-200" />
            <span>✓ Resultados en 24h</span>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <Section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: 490, suffix: '+', label: 'Influencers activos' },
              { value: 150, suffix: '+', label: 'Marcas registradas' },
              { value: 1200, suffix: '+', label: 'Colaboraciones cerradas' },
              { value: 4.9, suffix: '★', label: 'Valoración media' },
            ].map((stat, i) => (
              <motion.div key={i} variants={scaleIn} className="text-center p-6 rounded-2xl bg-violet-50 border border-violet-100">
                <div className="text-3xl font-black text-violet-700 mb-1">
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section className="py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Tan fácil como 1-2-3</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Sin intermediarios. Sin reuniones. Sin esperas.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Search size={24} />, n: '1', title: 'Publica o descubre', desc: 'Las marcas publican en minutos. Los creadores exploran colaboraciones de su nicho.' },
              { icon: <MessageCircle size={24} />, n: '2', title: 'Conecta y negocia', desc: 'Chat integrado, propuestas claras y condiciones acordadas en la plataforma.' },
              { icon: <TrendingUp size={24} />, n: '3', title: 'Mide el impacto', desc: 'Entrega resultados, sube métricas y cobra cuando la marca confirme.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm group cursor-default"
              >
                <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <div className="text-5xl font-black text-violet-100 mb-2">{step.n}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FOR BRANDS / CREATORS ── */}
      <Section className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Una plataforma, dos mundos</h2>
            <p className="text-gray-500 text-lg">Tanto si eres marca como creador, Connectly trabaja para ti.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Brands */}
            <motion.div
              variants={fadeLeft}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 p-8 text-white"
            >
              <Orb className="w-48 h-48 bg-white/20 -top-12 -right-12 blur-2xl opacity-40" />
              <div className="relative z-10">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-2xl font-bold mb-4">Para marcas</h3>
                <ul className="space-y-3 mb-8 text-violet-100">
                  {['Llega a influencers verificados de tu nicho', 'Publica tu campaña en menos de 5 minutos', 'Revisa propuestas y elige al mejor candidato', 'Panel de analytics con ROI real'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} className="text-violet-300 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register?role=brand">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-6 py-3 bg-white text-violet-700 rounded-xl text-sm font-bold hover:bg-violet-50 transition-colors"
                  >
                    Publicar campaña gratis →
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            {/* Creators */}
            <motion.div
              variants={fadeRight}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white"
            >
              <Orb className="w-48 h-48 bg-violet-500/20 -bottom-12 -left-12 blur-2xl opacity-50" />
              <div className="relative z-10">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-2xl font-bold mb-4">Para creadores</h3>
                <ul className="space-y-3 mb-8 text-gray-300">
                  {['Explora colaboraciones de tu nicho y ciudad', 'Aplica con un clic, sin formularios largos', 'Chatea directamente con la marca', 'Cobra de forma segura a través de la plataforma'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} className="text-violet-400 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register?role=creator">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors"
                  >
                    Crear mi perfil gratis →
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ── FEATURED INFLUENCERS ── */}
      <Section className="py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Creadores destacados</h2>
              <p className="text-gray-500">Perfiles verificados listos para colaborar.</p>
            </div>
            <Link href="/discover">
              <motion.button whileHover={{ x: 4 }} className="text-sm font-semibold text-violet-600 flex items-center gap-1">
                Ver todos <ArrowRight size={14} />
              </motion.button>
            </Link>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURED_INFLUENCERS.map((inf, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={`https://picsum.photos/seed/${inf.seed}/80/80`}
                    alt={inf.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                      {inf.name}
                      {inf.verified && <Zap size={10} className="text-violet-500 fill-violet-500" />}
                    </div>
                    <div className="text-xs text-gray-400">{inf.handle}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded-full font-medium">{inf.niche}</span>
                  <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-full">{inf.city}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span><span className="font-bold text-gray-900">{fmtFollowers(inf.followers)}</span> seguidores</span>
                  <span>ER <span className="font-bold text-emerald-600">{inf.er}%</span></span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                  Desde <span className="font-semibold text-gray-700">{inf.priceMin}€</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── FEATURED COLLABS ── */}
      <Section className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Colaboraciones activas</h2>
              <p className="text-gray-500">Marcas reales buscando creadores ahora mismo.</p>
            </div>
            <Link href="/discover">
              <motion.button whileHover={{ x: 4 }} className="text-sm font-semibold text-violet-600 flex items-center gap-1">
                Ver todas <ArrowRight size={14} />
              </motion.button>
            </Link>
          </motion.div>

          <motion.div variants={stagger} className="space-y-4">
            {FEATURED_COLLABS.map((c, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
                className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center gap-4 cursor-pointer group"
              >
                <img
                  src={`https://picsum.photos/seed/${c.seed}/64/64`}
                  alt={c.brand}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-gray-900 truncate">{c.title}</span>
                    {c.boosted && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100">
                        <Zap size={9} className="fill-amber-600" /> Destacada
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>{c.brand}</span>
                    <span>· {c.niche}</span>
                    <span>· {c.city}</span>
                  </div>
                </div>
                <span className={`hidden sm:block px-3 py-1 rounded-xl text-xs font-bold ${
                  c.type === 'Pago' ? 'bg-emerald-50 text-emerald-700' :
                  c.type === 'Canje' ? 'bg-blue-50 text-blue-700' :
                  'bg-violet-50 text-violet-700'
                }`}>
                  {c.type}
                </span>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section className="py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Todo lo que necesitas</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Herramientas profesionales para campañas reales.</p>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Search size={20} />, title: 'Búsqueda avanzada', desc: 'Filtra por nicho, ciudad, seguidores, ER y precio. Encuentra al influencer perfecto en segundos.' },
              { icon: <MessageCircle size={20} />, title: 'Chat integrado', desc: 'Negocia condiciones directamente en la plataforma. Sin emails, sin WhatsApp, todo en un lugar.' },
              { icon: <Shield size={20} />, title: 'Pagos seguros', desc: 'Sistema de depósito en garantía. El creador cobra cuando la marca confirma los resultados.' },
              { icon: <BarChart3 size={20} />, title: 'Analytics real', desc: 'Sube capturas, métricas y resultados verificados. ROI transparente para marcas.' },
              { icon: <Users size={20} />, title: 'Perfiles verificados', desc: 'Cada creador pasa por un proceso de verificación. Cero perfiles falsos o inflados.' },
              { icon: <Zap size={20} />, title: 'Campañas en minutos', desc: 'Publica una colaboración en menos de 5 minutos. Sin reuniones, sin burocracia.' },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── REVIEWS ── */}
      <Section className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Lo que dicen nuestros usuarios</h2>
            <div className="flex justify-center gap-0.5 mb-12">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={reviewIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 rounded-3xl p-8 border border-gray-100"
            >
              <p className="text-gray-700 text-lg leading-relaxed mb-6 italic">"{REVIEWS[reviewIdx].text}"</p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {REVIEWS[reviewIdx].name[0]}
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-900">{REVIEWS[reviewIdx].name}</div>
                  <div className="text-xs text-gray-400">{REVIEWS[reviewIdx].role}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-2 mt-6">
            {REVIEWS.map((_, i) => (
              <button
                key={i}
                onClick={() => setReviewIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === reviewIdx ? 'bg-violet-600 w-6' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA FINAL ── */}
      <section className="relative py-32 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-violet-800" />
        <Orb className="w-72 h-72 bg-white/10 top-0 right-0 blur-2xl opacity-50" />
        <Orb className="w-64 h-64 bg-purple-300/20 bottom-0 left-0 blur-3xl opacity-40" />

        {/* Animated stars */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/20 text-2xl select-none"
            style={{ top: `${15 + i * 14}%`, left: `${5 + i * 15}%` }}
            animate={{ y: [0, -12, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.7 }}
          >
            ✦
          </motion.div>
        ))}

        <div className="relative max-w-3xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
              ¿Listo para tu primera colaboración?
            </h2>
            <p className="text-violet-200 text-lg mb-10 max-w-xl mx-auto">
              Únete a más de 490 creadores y 150 marcas que ya usan Connectly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link href="/register?role=brand">
                  <button className="px-8 py-4 bg-white text-violet-700 rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all">
                    Publicar campaña gratis →
                  </button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link href="/register?role=creator">
                  <button className="px-8 py-4 bg-violet-500/30 border border-white/30 text-white rounded-2xl font-bold text-sm backdrop-blur-sm hover:bg-violet-500/50 transition-all">
                    Crear perfil como creador →
                  </button>
                </Link>
              </motion.div>
            </div>

            <p className="text-violet-300 text-xs mt-8">
              Sin tarjeta de crédito · Sin permanencia · Cancela cuando quieras
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="mb-4">
                <img src="/logo-horizontal.svg" alt="Connectly" className="h-7 w-auto brightness-0 invert" />
              </div>
              <p className="text-xs leading-relaxed">La plataforma de influencer marketing más rápida de España.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Plataforma</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/discover" className="hover:text-white transition-colors">Descubrir</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Planes</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Empresa</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/about" className="hover:text-white transition-colors">Sobre nosotros</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Términos</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs">© {new Date().getFullYear()} Connectly · Todos los derechos reservados</p>
            <p className="text-xs">Hecho con ❤️ en España · Byinfluence</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
