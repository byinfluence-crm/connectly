'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CreditCard, Zap, CheckCircle, Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { openBillingPortal, startSubscriptionCheckout } from '@/lib/supabase';

const PLAN_NAMES: Record<string, string> = {
  free: 'Gratis',
  starter: 'Starter',
  pro: 'Pro',
};

const PLAN_PRICES_BRAND: Record<string, string> = {
  free: '0€/mes',
  starter: '19€/mes',
  pro: '49€/mes',
};

const PLAN_PRICES_CREATOR: Record<string, string> = {
  free: '0€/mes',
  starter: '4€/mes',
  pro: '9€/mes',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Activa', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  trialing: { label: 'Periodo de prueba', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  past_due: { label: 'Pago pendiente', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  canceled: { label: 'Cancelada', color: 'bg-gray-50 text-gray-600 border-gray-200' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BillingSettings({ role }: { role: 'brand' | 'influencer' }) {
  const { user } = useAuth();
  const {
    plan, status, trial_end, cancel_at_period_end, current_period_end,
    stripe_customer_id, limits, loading,
  } = useSubscription(user?.id ?? null, role);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const prices = role === 'brand' ? PLAN_PRICES_BRAND : PLAN_PRICES_CREATOR;
  const currentStatus = status ? STATUS_LABELS[status] : null;

  const handlePortal = async () => {
    if (!user?.id) return;
    setLoadingAction('portal');
    setErr(null);
    try {
      const url = await openBillingPortal(user.id);
      window.location.href = url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error abriendo portal');
      setLoadingAction(null);
    }
  };

  const handleUpgrade = async (toPlan: 'starter' | 'pro') => {
    if (!user?.id) return;
    setLoadingAction(`upgrade-${toPlan}`);
    setErr(null);
    try {
      const url = await startSubscriptionCheckout(user.id, toPlan);
      window.location.href = url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error activando plan');
      setLoadingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Facturación y plan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestiona tu suscripción y consulta el uso del plan.</p>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 flex items-start gap-2">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      {/* Plan actual */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
              Plan actual
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{PLAN_NAMES[plan]}</span>
              <span className="text-sm text-gray-500">{prices[plan]}</span>
              {currentStatus && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
              )}
            </div>
          </div>
          <Zap size={24} className="text-violet-400 flex-shrink-0" />
        </div>

        {status === 'trialing' && trial_end && (
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-sm text-violet-700 mb-4 flex items-start gap-2">
            <Clock size={15} className="flex-shrink-0 mt-0.5" />
            <span>Estás en periodo de prueba. El primer cobro será el <strong>{formatDate(trial_end)}</strong>.</span>
          </div>
        )}

        {cancel_at_period_end && current_period_end && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800 mb-4 flex items-start gap-2">
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span>Tu suscripción se cancelará el <strong>{formatDate(current_period_end)}</strong>. Después volverás al plan Gratis.</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {plan === 'free' ? (
            <>
              <Button
                size="sm"
                loading={loadingAction === 'upgrade-starter'}
                onClick={() => handleUpgrade('starter')}
              >
                <ArrowRight size={14} /> Activar Starter
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={loadingAction === 'upgrade-pro'}
                onClick={() => handleUpgrade('pro')}
              >
                Activar Pro
              </Button>
            </>
          ) : plan === 'starter' ? (
            <>
              <Button
                size="sm"
                loading={loadingAction === 'upgrade-pro'}
                onClick={() => handleUpgrade('pro')}
              >
                <ArrowRight size={14} /> Actualizar a Pro
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={loadingAction === 'portal'}
                onClick={handlePortal}
                disabled={!stripe_customer_id}
              >
                <CreditCard size={14} /> Gestionar suscripción
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              loading={loadingAction === 'portal'}
              onClick={handlePortal}
              disabled={!stripe_customer_id}
            >
              <CreditCard size={14} /> Gestionar suscripción
            </Button>
          )}
        </div>
      </div>

      {/* Beneficios del plan */}
      {limits && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
            Qué incluye tu plan
          </div>
          <ul className="space-y-2.5">
            {role === 'brand' ? (
              <>
                <Benefit
                  on={limits.max_active_collabs === null}
                  label={limits.max_active_collabs === null
                    ? 'Colaboraciones activas ilimitadas'
                    : `${limits.max_active_collabs} colaboración${limits.max_active_collabs === 1 ? '' : 'es'} activa${limits.max_active_collabs === 1 ? '' : 's'} simultánea${limits.max_active_collabs === 1 ? '' : 's'}`}
                />
                <Benefit
                  on={limits.max_candidates_visible_month === null}
                  label={limits.max_candidates_visible_month === null
                    ? 'Candidatos ilimitados'
                    : `${limits.max_candidates_visible_month} candidatos/mes`}
                />
                <Benefit
                  on={limits.monthly_credits > 0}
                  label={limits.monthly_credits > 0
                    ? `${limits.monthly_credits} créditos al mes`
                    : 'Sin créditos recurrentes'}
                />
                <Benefit on={limits.has_advanced_search} label="Búsqueda avanzada con filtros" />
                <Benefit on={limits.has_ai_matching} label="IA de afinidad creador ↔ campaña" />
                <Benefit on={limits.has_roi_reports} label="Reportes ROI descargables" />
                <Benefit on={limits.priority_support} label="Soporte prioritario < 24h" />
              </>
            ) : (
              <>
                <Benefit
                  on={limits.max_applications_month === null}
                  label={limits.max_applications_month === null
                    ? 'Aplicaciones ilimitadas'
                    : `${limits.max_applications_month} aplicaciones/mes`}
                />
                <Benefit on={limits.featured_in_discover} label="Perfil destacado en el discover" />
                <Benefit on={limits.priority_support} label="Acceso a campañas exclusivas" />
              </>
            )}
          </ul>
        </div>
      )}

      <div className="text-center text-xs text-gray-400">
        <Link href="/pricing" className="text-violet-600 font-medium hover:text-violet-700">
          Ver comparativa completa de planes →
        </Link>
      </div>
    </div>
  );
}

function Benefit({ on, label }: { on: boolean; label: string }) {
  return (
    <li className={`flex items-start gap-2 text-sm ${on ? 'text-gray-700' : 'text-gray-400'}`}>
      {on ? (
        <CheckCircle size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
      ) : (
        <span className="w-[15px] h-[15px] rounded-full bg-gray-100 flex-shrink-0 mt-0.5" />
      )}
      {label}
    </li>
  );
}

