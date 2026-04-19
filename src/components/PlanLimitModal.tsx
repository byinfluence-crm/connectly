'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, X, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { startSubscriptionCheckout } from '@/lib/supabase';

/**
 * Modal que se muestra cuando un usuario intenta ejecutar una acción
 * bloqueada por los límites de su plan. Ofrece upgrade directo a Stripe Checkout.
 */
export default function PlanLimitModal({
  open,
  onClose,
  userId,
  role,
  reason,
  current,
  limit,
  upgradeTo,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  role: 'brand' | 'influencer';
  reason: string;
  current?: number;
  limit?: number;
  upgradeTo: 'starter' | 'pro';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const url = await startSubscriptionCheckout(userId, upgradeTo);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const REASON_TEXT: Record<string, { title: string; desc: string }> = {
    max_active_collabs_reached: {
      title: 'Has alcanzado el máximo de colaboraciones activas',
      desc: `Tu plan actual permite ${limit ?? '—'} colaboración${limit === 1 ? '' : 'es'} activa${limit === 1 ? '' : 's'} simultáneas. Cierra alguna o actualiza tu plan.`,
    },
    max_applications_month_reached: {
      title: 'Has alcanzado el máximo de aplicaciones este mes',
      desc: `Tu plan actual permite ${limit ?? '—'} aplicaciones al mes. Actualiza para aplicar sin límites.`,
    },
    max_candidates_reached: {
      title: 'Has alcanzado el máximo de candidatos visibles',
      desc: `Tu plan actual te deja ver ${limit ?? '—'} candidatos al mes. Actualiza para acceso ilimitado.`,
    },
    insufficient_credits: {
      title: 'Créditos insuficientes',
      desc: `Tienes ${current ?? 0} créditos. Necesitas 10 para desbloquear este perfil. Con Starter recibes 100 créditos/mes.`,
    },
  };

  const info = REASON_TEXT[reason] ?? { title: 'Actualiza tu plan', desc: 'Para continuar, actualiza a un plan superior.' };

  const PLAN_BENEFITS = upgradeTo === 'starter'
    ? (role === 'brand'
        ? ['5 colaboraciones activas', 'Candidatos ilimitados', '100 créditos/mes', 'Búsqueda avanzada']
        : ['15 aplicaciones/mes', 'Perfil destacado', 'Badge verificado', 'Analytics básicos'])
    : (role === 'brand'
        ? ['Colaboraciones ilimitadas', 'Desbloqueos ilimitados', 'IA de afinidad', 'Reportes ROI', 'Soporte prioritario']
        : ['Aplicaciones ilimitadas', '#1 en categoría 1 día/mes', 'Boost 3 días mensual', 'Campañas exclusivas']);

  const PLAN_PRICE = upgradeTo === 'starter'
    ? (role === 'brand' ? '19€' : '4€')
    : (role === 'brand' ? '49€' : '9€');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-violet-600 to-violet-800 p-6 relative">
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <X size={14} />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-3">
            <Zap size={22} className="text-white" fill="white" />
          </div>
          <h2 className="text-white font-bold text-lg mb-1">{info.title}</h2>
          <p className="text-violet-100 text-sm leading-relaxed">{info.desc}</p>
        </div>

        <div className="p-6">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-gray-900">{PLAN_PRICE}</span>
            <span className="text-sm text-gray-500">/mes</span>
            <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              7 días gratis
            </span>
          </div>

          <div className="space-y-2 mb-5">
            {PLAN_BENEFITS.map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">{b}</span>
              </div>
            ))}
          </div>

          <Button fullWidth size="lg" loading={loading} onClick={handleUpgrade}>
            Actualizar a {upgradeTo === 'starter' ? 'Starter' : 'Pro'}
          </Button>

          <button
            onClick={() => { onClose(); router.push('/pricing'); }}
            className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 py-2"
          >
            Ver todos los planes
          </button>
        </div>
      </div>
    </div>
  );
}
