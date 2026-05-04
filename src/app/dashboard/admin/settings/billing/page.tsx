'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  CheckCircle2, Loader2, AlertCircle, CreditCard,
  Building2, Zap, Users, BarChart3, Shield,
} from 'lucide-react';

interface BillingStatus {
  subscribed: boolean;
  status: string | null;
  plan: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  has_customer: boolean;
}

const FEATURES = [
  { icon: Building2, text: 'Gestión ilimitada de marcas' },
  { icon: Users,     text: 'Acceso a todos los creadores del marketplace' },
  { icon: Zap,       text: 'Creación de colaboraciones sin límite' },
  { icon: BarChart3, text: 'Analytics completos por marca' },
  { icon: Shield,    text: 'Panel de agencia con vista unificada' },
  { icon: CheckCircle2, text: 'Soporte prioritario' },
];

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AdminBillingPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [billing, setBilling]   = useState<BillingStatus | null>(null);
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setAL]  = useState(false);
  const [error, setError]       = useState('');
  const justSucceeded = searchParams.get('success') === 'true';

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/billing')
      .then(r => r.json())
      .then(d => setBilling(d))
      .finally(() => setLoading(false));
  }, [user]);

  const callAction = async (action: 'checkout' | 'portal') => {
    setAL(true);
    setError('');
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      setAL(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-violet-600" />
      </div>
    );
  }

  const isActive  = billing?.subscribed && billing.status === 'active';
  const isTrialing = billing?.status === 'trialing';
  const isPastDue  = billing?.status === 'past_due';

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
        <p className="text-sm text-gray-500 mt-0.5">Plan de agencia Connectly</p>
      </div>

      {justSucceeded && (
        <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={16} className="shrink-0" />
          Suscripción activada correctamente. ¡Bienvenido al Plan Agencia!
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Tarjeta del plan */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        {/* Header del plan */}
        <div className="bg-gradient-to-br from-violet-600 to-violet-800 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-violet-200 text-sm font-medium mb-1">Plan</p>
              <h2 className="text-2xl font-bold">Agencia</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">150€</p>
              <p className="text-violet-300 text-sm">/ mes</p>
            </div>
          </div>

          {/* Estado */}
          {(isActive || isTrialing || isPastDue) && (
            <div className="mt-4">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                isActive    ? 'bg-green-400/20 text-green-200' :
                isTrialing  ? 'bg-yellow-400/20 text-yellow-200' :
                              'bg-red-400/20 text-red-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-300' : isTrialing ? 'bg-yellow-300' : 'bg-red-300'}`} />
                {isActive ? 'Activo' : isTrialing ? 'Periodo de prueba' : 'Pago pendiente'}
              </span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Incluye:</p>
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-violet-600" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Fechas si está suscrito */}
        {billing?.subscribed && (
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 space-y-1.5">
            {billing.current_period_end && (
              <p className="text-xs text-gray-500">
                {billing.cancel_at_period_end ? 'Cancela el' : 'Próxima renovación'}:{' '}
                <span className="font-medium text-gray-700">{fmtDate(billing.current_period_end)}</span>
              </p>
            )}
            {isTrialing && billing.trial_end && (
              <p className="text-xs text-gray-500">
                Prueba gratuita hasta: <span className="font-medium text-gray-700">{fmtDate(billing.trial_end)}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      {!billing?.subscribed ? (
        <button
          onClick={() => callAction('checkout')}
          disabled={actionLoading}
          className="flex items-center justify-center gap-2 w-full bg-violet-600 text-white px-5 py-3.5 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 transition-colors"
        >
          {actionLoading
            ? <Loader2 size={16} className="animate-spin" />
            : <CreditCard size={16} />
          }
          {actionLoading ? 'Redirigiendo a Stripe...' : 'Suscribirse — 150€/mes'}
        </button>
      ) : (
        <button
          onClick={() => callAction('portal')}
          disabled={actionLoading}
          className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 px-5 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 transition-colors"
        >
          {actionLoading
            ? <Loader2 size={16} className="animate-spin" />
            : <CreditCard size={16} />
          }
          {actionLoading ? 'Redirigiendo...' : 'Gestionar suscripción'}
        </button>
      )}

      <p className="text-xs text-gray-400 text-center mt-3">
        Pago seguro con Stripe · Cancela cuando quieras
      </p>
    </div>
  );
}
