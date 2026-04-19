'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Check, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { startSubscriptionCheckout } from '@/lib/supabase';

type Plan = {
  name: string;
  price: number;
  description: string;
  color: string;
  badge?: string;
  features: string[];
  plan: 'free' | 'starter' | 'pro';
  highlighted: boolean;
};

const PLANS: Record<'influencer' | 'brand', Plan[]> = {
  influencer: [
    {
      name: 'Gratis',
      price: 0,
      description: 'Para empezar a explorar',
      color: 'border-gray-200',
      features: [
        'Perfil público básico',
        '3 aplicaciones al mes',
        'Chat con marcas que te acepten',
        'Badge de verificación básico',
      ],
      plan: 'free',
      highlighted: false,
    },
    {
      name: 'Starter',
      price: 4,
      description: '7 días gratis al activar',
      color: 'border-violet-500 ring-2 ring-violet-500',
      badge: 'Más popular',
      features: [
        '15 aplicaciones al mes',
        'Perfil destacado en el discover',
        'Badge verificado Pro',
        'Analytics básicos',
        'Prioridad en búsquedas',
      ],
      plan: 'starter',
      highlighted: true,
    },
    {
      name: 'Pro',
      price: 9,
      description: 'Para creadores profesionales',
      color: 'border-gray-200',
      features: [
        'Aplicaciones ilimitadas',
        '#1 en tu categoría 1 día/mes',
        'Boost 3 días mensual gratis',
        'Score Connectly público',
        'Acceso a campañas exclusivas',
        'Analytics completos + Score',
      ],
      plan: 'pro',
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
        'Búsqueda básica',
        '5 candidatos visibles/mes',
        '20 créditos de bienvenida',
      ],
      plan: 'free',
      highlighted: false,
    },
    {
      name: 'Starter',
      price: 19,
      description: '7 días gratis al activar',
      color: 'border-violet-500 ring-2 ring-violet-500',
      badge: 'Más popular',
      features: [
        '5 colaboraciones activas',
        'Candidatos ilimitados',
        '100 créditos mensuales',
        'Búsqueda avanzada con filtros',
        'Estadísticas de campañas',
      ],
      plan: 'starter',
      highlighted: true,
    },
    {
      name: 'Pro',
      price: 49,
      description: 'Para marcas con volumen',
      color: 'border-gray-200',
      features: [
        'Colaboraciones ilimitadas',
        'Desbloqueos ilimitados',
        '500 créditos mensuales',
        'IA de afinidad creador↔campaña',
        'Reportes de ROI descargables',
        'Destacado en discover de creadores',
        'Soporte prioritario < 24h',
      ],
      plan: 'pro',
      highlighted: false,
    },
  ],
};

function PlanCard({ p, role, user, loadingKey, onSubscribe }: {
  p: Plan;
  role: 'influencer' | 'brand';
  user: { id: string; user_metadata?: { user_type?: string } } | null;
  loadingKey: string | null;
  onSubscribe: (plan: 'starter' | 'pro') => void;
}) {
  const loading = loadingKey === `${role}-${p.plan}`;
  const userType = user?.user_metadata?.user_type;
  const isCurrentRole = userType === (role === 'influencer' ? 'influencer' : 'brand');

  const handleClick = () => {
    if (p.plan === 'free') return; // CTA gestionado como Link
    onSubscribe(p.plan);
  };

  return (
    <div
      className={`relative rounded-2xl border-2 p-6 flex flex-col ${p.color} ${p.highlighted ? 'bg-violet-50' : 'bg-white'}`}
    >
      {p.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="primary" size="md">{p.badge}</Badge>
        </div>
      )}
      <div className="mb-5">
        <div className="text-base font-bold text-gray-900 mb-1">{p.name}</div>
        <div className="flex items-end gap-1 mb-2">
          <span className="text-3xl font-bold text-gray-900">
            {p.price === 0 ? 'Gratis' : `${p.price}€`}
          </span>
          {p.price > 0 && <span className="text-gray-400 text-sm mb-1">/mes</span>}
        </div>
        <p className="text-xs text-gray-500">{p.description}</p>
      </div>
      <ul className="space-y-2.5 flex-1 mb-6">
        {p.features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
            <Check size={15} className="text-violet-500 flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      {p.plan === 'free' ? (
        <Link href={`/register?role=${role}`}>
          <Button variant={p.highlighted ? 'primary' : 'outline'} fullWidth>
            Empezar gratis
          </Button>
        </Link>
      ) : !user ? (
        <Link href={`/register?role=${role}&plan=${p.plan}`}>
          <Button variant={p.highlighted ? 'primary' : 'outline'} fullWidth>
            Registrarme y activar
          </Button>
        </Link>
      ) : !isCurrentRole ? (
        <Button variant="outline" fullWidth disabled>
          No disponible para tu cuenta
        </Button>
      ) : (
        <Button
          variant={p.highlighted ? 'primary' : 'outline'}
          fullWidth
          loading={loading}
          onClick={handleClick}
        >
          Activar 7 días gratis
        </Button>
      )}
    </div>
  );
}

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleSubscribe = async (role: 'influencer' | 'brand', plan: 'starter' | 'pro') => {
    if (!user?.id) {
      router.push(`/register?role=${role}&plan=${plan}`);
      return;
    }
    setLoadingKey(`${role}-${plan}`);
    setErr(null);
    try {
      const url = await startSubscriptionCheckout(user.id, plan);
      window.location.href = url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al iniciar suscripción');
      setLoadingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-16">
            <Badge variant="primary" size="md" className="mb-4 inline-flex">
              <Zap size={12} className="text-violet-600" />
              Planes y precios
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Empieza gratis. Escala cuando quieras.
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              7 días gratis al activar un plan de pago. Cancela cuando quieras.
            </p>
          </div>

          {err && (
            <div className="max-w-lg mx-auto bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 mb-8">
              {err}
            </div>
          )}

          <div className="mb-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">✨</span> Para creadores de contenido
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.influencer.map(p => (
                <PlanCard
                  key={p.name}
                  p={p}
                  role="influencer"
                  user={user}
                  loadingKey={loadingKey}
                  onSubscribe={plan => handleSubscribe('influencer', plan)}
                />
              ))}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">🏢</span> Para marcas y agencias
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.brand.map(p => (
                <PlanCard
                  key={p.name}
                  p={p}
                  role="brand"
                  user={user}
                  loadingKey={loadingKey}
                  onSubscribe={plan => handleSubscribe('brand', plan)}
                />
              ))}
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Preguntas frecuentes</h2>
            <div className="space-y-6">
              {[
                { q: '¿Necesito tarjeta de crédito para activar el trial?', a: 'Sí, para el trial de 7 días se solicita la tarjeta. No se cobra nada hasta el día 8 y puedes cancelar antes en cualquier momento.' },
                { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Puedes subir o bajar de plan cuando quieras desde tu dashboard. Los cambios aplican al instante.' },
                { q: '¿Qué pasa si cancelo?', a: 'Tu plan sigue activo hasta el final del periodo ya pagado. Después vuelves al plan Gratis automáticamente.' },
                { q: '¿Hay comisión por colaboración cerrada?', a: 'En colaboraciones con pago hay una comisión del 10%. En proyectos UGC es 20%. No hay comisión en canjes simples.' },
              ].map(({ q, a }) => (
                <div key={q} className="border-b border-gray-100 pb-6">
                  <div className="font-semibold text-gray-900 mb-2">{q}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">{a}</div>
                </div>
              ))}
            </div>
          </div>

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
