import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Check, Zap, ArrowRight } from 'lucide-react';

const PLANS = {
  influencer: [
    {
      name: 'Gratis',
      price: 0,
      description: 'Para empezar a explorar',
      color: 'border-gray-200',
      features: [
        'Perfil público básico',
        'Recibir hasta 3 propuestas/mes',
        'Chat con marcas',
        'Badge de verificación básico',
      ],
      cta: 'Empezar gratis',
      href: '/register?role=influencer&plan=free',
      highlighted: false,
    },
    {
      name: 'Starter',
      price: 5,
      description: '1 mes gratis al registrarte',
      color: 'border-violet-500 ring-2 ring-violet-500',
      badge: 'Más popular',
      features: [
        'Perfil completo con portfolio',
        'Propuestas ilimitadas',
        'Aparecer en búsquedas destacadas',
        'Badge verificado Pro',
        'Estadísticas de perfil',
        'Prioridad en el feed',
      ],
      cta: 'Empezar con 1 mes gratis',
      href: '/register?role=influencer&plan=starter',
      highlighted: true,
    },
    {
      name: 'Pro',
      price: 12,
      description: 'Para creadores serios',
      color: 'border-gray-200',
      features: [
        'Todo lo de Starter',
        'Posición #1 en tu categoría',
        'Perfil featured en la home',
        'Análisis avanzado de colaboraciones',
        'Soporte prioritario',
        'Badge exclusivo Pro+',
      ],
      cta: 'Empezar con 1 mes gratis',
      href: '/register?role=influencer&plan=pro',
      highlighted: false,
    },
  ],
  brand: [
    {
      name: 'Gratis',
      price: 0,
      description: 'Para probar la plataforma',
      color: 'border-gray-200',
      features: [
        '1 colaboración activa',
        'Búsqueda básica de creadores',
        'Chat con influencers',
        'Hasta 5 solicitudes/mes',
      ],
      cta: 'Empezar gratis',
      href: '/register?role=brand&plan=free',
      highlighted: false,
    },
    {
      name: 'Starter',
      price: 9,
      description: '1 mes gratis al registrarte',
      color: 'border-violet-500 ring-2 ring-violet-500',
      badge: 'Más popular',
      features: [
        'Hasta 5 colaboraciones activas',
        'Búsqueda avanzada con filtros',
        'Acceso a perfiles verificados',
        'Estadísticas de campañas',
        'Boost básico (3 días/mes)',
        'Soporte por email',
      ],
      cta: 'Empezar con 1 mes gratis',
      href: '/register?role=brand&plan=starter',
      highlighted: true,
    },
    {
      name: 'Pro',
      price: 29,
      description: 'Para marcas con volumen',
      color: 'border-gray-200',
      features: [
        'Colaboraciones ilimitadas',
        'Búsqueda con IA de afinidad',
        'Acceso a todos los perfiles',
        'Boosts ilimitados',
        'Reportes de ROI detallados',
        'Soporte prioritario + gestor',
      ],
      cta: 'Empezar con 1 mes gratis',
      href: '/register?role=brand&plan=pro',
      highlighted: false,
    },
  ],
};

const BOOST_OPTIONS = [
  { name: 'Boost 3 días', price: 9, desc: 'Tu colaboración en lo alto del feed 3 días' },
  { name: 'Boost 7 días', price: 19, desc: 'Una semana en posición destacada', popular: true },
  { name: 'Boost 14 días', price: 35, desc: '2 semanas con badge "Urgente" incluido' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="primary" size="md" className="mb-4 inline-flex">
              <Zap size={12} className="text-violet-600" />
              Planes y precios
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Empieza gratis. Escala cuando quieras.
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              El primer mes es gratis en todos los planes. Sin tarjeta de crédito.
            </p>
          </div>

          {/* Influencers */}
          <div className="mb-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">✨</span> Para creadores de contenido
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.influencer.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border-2 p-6 flex flex-col ${plan.color} ${plan.highlighted ? 'bg-violet-50' : 'bg-white'}`}
                >
                  {'badge' in plan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="primary" size="md">{plan.badge as string}</Badge>
                    </div>
                  )}
                  <div className="mb-5">
                    <div className="text-base font-bold text-gray-900 mb-1">{plan.name}</div>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-3xl font-bold text-gray-900">{plan.price === 0 ? 'Gratis' : `${plan.price}€`}</span>
                      {plan.price > 0 && <span className="text-gray-400 text-sm mb-1">/mes</span>}
                    </div>
                    <p className="text-xs text-gray-500">{plan.description}</p>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check size={15} className="text-violet-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href}>
                    <Button variant={plan.highlighted ? 'primary' : 'outline'} fullWidth>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Marcas */}
          <div className="mb-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">🏢</span> Para marcas y agencias
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.brand.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border-2 p-6 flex flex-col ${plan.color} ${plan.highlighted ? 'bg-violet-50' : 'bg-white'}`}
                >
                  {'badge' in plan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="primary" size="md">{plan.badge as string}</Badge>
                    </div>
                  )}
                  <div className="mb-5">
                    <div className="text-base font-bold text-gray-900 mb-1">{plan.name}</div>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-3xl font-bold text-gray-900">{plan.price === 0 ? 'Gratis' : `${plan.price}€`}</span>
                      {plan.price > 0 && <span className="text-gray-400 text-sm mb-1">/mes</span>}
                    </div>
                    <p className="text-xs text-gray-500">{plan.description}</p>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check size={15} className="text-violet-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href}>
                    <Button variant={plan.highlighted ? 'primary' : 'outline'} fullWidth>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Boost */}
          <div className="bg-gray-50 rounded-3xl p-8 mb-16">
            <div className="flex items-center gap-3 mb-2">
              <Zap size={20} className="text-violet-600" />
              <h2 className="text-xl font-bold text-gray-900">Boosts puntuales</h2>
            </div>
            <p className="text-gray-500 text-sm mb-8 max-w-xl">
              Disponibles en todos los planes. Actívalos cuando necesites más visibilidad: renovación de carta, lanzamiento de producto, evento puntual.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {BOOST_OPTIONS.map(b => (
                <div
                  key={b.name}
                  className={`bg-white rounded-2xl p-5 border-2 ${b.popular ? 'border-violet-300' : 'border-gray-100'} relative`}
                >
                  {b.popular && (
                    <div className="absolute -top-3 left-4">
                      <Badge variant="primary" size="sm">Más elegido</Badge>
                    </div>
                  )}
                  <div className="text-2xl font-bold text-gray-900 mb-1">{b.price}€</div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">{b.name}</div>
                  <div className="text-xs text-gray-500">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Preguntas frecuentes</h2>
            <div className="space-y-6">
              {[
                { q: '¿Necesito tarjeta de crédito para el mes gratis?', a: 'No. El primer mes no requiere ningún dato de pago. Solo cuando quieras continuar.' },
                { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Puedes subir o bajar de plan cuando quieras. Los cambios aplican en el siguiente ciclo.' },
                { q: '¿Los boosts se pueden combinar con cualquier plan?', a: 'Sí, los boosts son pagos puntuales disponibles para todos los planes, incluido el gratuito.' },
                { q: '¿Hay comisión por colaboración cerrada?', a: 'No. Connectly no cobra comisión sobre las colaboraciones. Solo pagas la suscripción.' },
              ].map(({ q, a }) => (
                <div key={q} className="border-b border-gray-100 pb-6">
                  <div className="font-semibold text-gray-900 mb-2">{q}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">{a}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Listo para empezar?</h2>
            <Link href="/register">
              <Button size="lg" className="shadow-lg shadow-violet-200">
                Crear cuenta gratis <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
