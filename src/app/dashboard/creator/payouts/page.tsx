'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Zap, CheckCircle, Clock, AlertCircle, ExternalLink,
  CreditCard, ArrowDownToLine, Shield,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import {
  getCreatorConnectStatus, getEscrowsByUser, getInvoicesByUser,
} from '@/lib/supabase';
import type { EscrowPayment, Invoice } from '@/lib/supabase';

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_MAP = {
  held:              { label: 'Retenido',   color: 'bg-amber-100 text-amber-700' },
  released:          { label: 'Liberado',   color: 'bg-emerald-100 text-emerald-700' },
  disputed:          { label: 'Disputa',    color: 'bg-red-100 text-red-700' },
  refunded_partial:  { label: 'Reembolsado', color: 'bg-gray-100 text-gray-600' },
};

function PayoutsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const onboarded = searchParams.get('onboarded') === 'true';

  const [connectStatus, setConnectStatus] = useState<{ stripe_connect_id: string | null; stripe_connect_onboarded: boolean } | null>(null);
  const [escrows, setEscrows] = useState<EscrowPayment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getCreatorConnectStatus(user.id),
      getEscrowsByUser(user.id),
      getInvoicesByUser(user.id),
    ]).then(([status, esc, inv]) => {
      setConnectStatus(status);
      setEscrows(esc.filter(e => e.payee_user_id === user.id));
      setInvoices(inv.filter(i => i.type === 'payout'));
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const handleConnect = async () => {
    if (!user?.id) return;
    setConnecting(true);
    const res = await fetch('/api/stripe/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });
    const { url, error } = await res.json() as { url?: string; error?: string };
    if (url) window.location.href = url;
    else { console.error(error); setConnecting(false); }
  };

  const pendingCents = escrows.filter(e => e.status === 'held').reduce((s, e) => s + e.net_amount_cents, 0);
  const paidCents = escrows.filter(e => e.status === 'released').reduce((s, e) => s + e.net_amount_cents, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Cobros y pagos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestiona tu cuenta de cobro y descarga tus facturas</p>
      </div>

      {/* Banner éxito onboarding */}
      {onboarded && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-emerald-800">¡Cuenta de cobro conectada!</div>
            <div className="text-xs text-emerald-600 mt-0.5">Ya puedes recibir pagos directamente en tu cuenta bancaria.</div>
          </div>
        </div>
      )}

      {/* Stripe Connect status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-violet-600" /> Cuenta de cobro
        </h2>

        {connectStatus?.stripe_connect_onboarded ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Cuenta verificada</div>
              <div className="text-xs text-gray-400">Recibirás los pagos en tu cuenta bancaria en 3-5 días hábiles</div>
            </div>
          </div>
        ) : connectStatus?.stripe_connect_id ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Verificación pendiente</div>
                <div className="text-xs text-gray-400">Completa el proceso de verificación para recibir pagos</div>
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {connecting ? 'Redirigiendo...' : 'Completar verificación'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Conecta tu cuenta bancaria para recibir pagos automáticamente cuando completes proyectos UGC o colaboraciones de pago.
            </p>
            <div className="flex items-start gap-2 text-xs text-gray-400">
              <Shield size={13} className="flex-shrink-0 mt-0.5 text-violet-400" />
              Proceso seguro gestionado por Stripe. Connectly nunca almacena tus datos bancarios.
            </div>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CreditCard size={15} />
              {connecting ? 'Redirigiendo a Stripe...' : 'Conectar cuenta bancaria'}
            </button>
          </div>
        )}
      </div>

      {/* Resumen de saldo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold mb-1">
            <Clock size={12} /> Pendiente de cobro
          </div>
          <div className="text-2xl font-bold text-amber-700">{formatEuros(pendingCents)}</div>
          <div className="text-xs text-amber-500 mt-0.5">Se libera a los 7 días</div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mb-1">
            <CheckCircle size={12} /> Total cobrado
          </div>
          <div className="text-2xl font-bold text-emerald-700">{formatEuros(paidCents)}</div>
          <div className="text-xs text-emerald-500 mt-0.5">{escrows.filter(e => e.status === 'released').length} proyectos</div>
        </div>
      </div>

      {/* Historial de pagos */}
      {escrows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Historial de pagos</h2>
          <div className="space-y-3">
            {escrows.map(e => {
              const st = STATUS_MAP[e.status];
              const releaseDate = new Date(e.held_at);
              releaseDate.setDate(releaseDate.getDate() + 7);
              return (
                <div key={e.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${e.status === 'released' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    {e.status === 'released'
                      ? <ArrowDownToLine size={14} className="text-emerald-600" />
                      : <Clock size={14} className="text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{formatEuros(e.net_amount_cents)}</div>
                    <div className="text-xs text-gray-400">
                      {e.status === 'held'
                        ? `Disponible el ${formatDate(releaseDate.toISOString())}`
                        : `Liberado el ${formatDate(e.released_at!)}`}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Facturas */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap size={15} className="text-violet-600" /> Mis liquidaciones
          </h2>
          <div className="space-y-2">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{inv.invoice_number}</div>
                  <div className="text-xs text-gray-400">{formatDate(inv.issued_at)} · {formatEuros(inv.amount_cents)}</div>
                </div>
                {inv.pdf_url ? (
                  <a
                    href={inv.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <ExternalLink size={12} /> Descargar
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl">PDF próximamente</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {escrows.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <div className="text-3xl mb-3">💸</div>
          <div className="text-sm font-semibold text-gray-700 mb-1">Sin pagos todavía</div>
          <div className="text-xs text-gray-400">Cuando completes un proyecto UGC o colaboración de pago, tus cobros aparecerán aquí</div>
        </div>
      )}
    </div>
  );
}

export default function PayoutsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400">Cargando...</div>}>
      <PayoutsContent />
    </Suspense>
  );
}
