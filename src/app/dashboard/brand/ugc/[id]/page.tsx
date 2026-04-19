'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle, Clock, Video, Camera, Film, Image,
  ExternalLink, AlertCircle, RotateCcw, Send, CreditCard,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getUgcProject, updateUgcProjectStatus, getUgcDeliveries } from '@/lib/supabase';
import type { UgcProject, UgcProjectStatus, UgcDelivery } from '@/types';

/* ─── 8 estados del flujo UGC ───────────────────────────────────────────── */
const STEPS: { status: UgcProjectStatus; label: string; desc: string }[] = [
  { status: 'draft',             label: 'Borrador',          desc: 'Briefing en preparación' },
  { status: 'briefing_sent',     label: 'Briefing enviado',  desc: 'El creador ha recibido el briefing' },
  { status: 'accepted',          label: 'Aceptado',          desc: 'El creador aceptó el proyecto' },
  { status: 'in_production',     label: 'En producción',     desc: 'El creador está grabando/editando' },
  { status: 'content_submitted', label: 'Contenido enviado', desc: 'El creador subió los archivos' },
  { status: 'brand_reviewing',   label: 'En revisión',       desc: 'Estás revisando el contenido' },
  { status: 'revision_requested','label': 'Revisión pedida', desc: 'Solicitaste cambios al creador' },
  { status: 'completed',         label: 'Completado',        desc: 'Proyecto finalizado con éxito' },
];

const TERMINAL_STATUSES: UgcProjectStatus[] = ['completed', 'cancelled', 'disputed'];
const STATUS_STEP_INDEX: Partial<Record<UgcProjectStatus, number>> = Object.fromEntries(
  STEPS.map((s, i) => [s.status, i])
);

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video size={13} />, reel: <Film size={13} />,
  foto: <Camera size={13} />, carrusel: <Image size={13} />, story: <Film size={13} />,
};

const USAGE_LABELS = {
  brand_owned: 'Propiedad total',
  shared: 'Uso compartido',
  licensed: 'Licencia',
};

/* ─── Helpers de acción según estado + rol ─────────────────────────────── */
function getBrandActions(status: UgcProjectStatus): { label: string; next: UgcProjectStatus; variant: 'approve' | 'reject' | 'neutral' }[] {
  switch (status) {
    case 'draft':
      return [{ label: 'Publicar briefing', next: 'briefing_sent', variant: 'approve' }];
    case 'brand_reviewing':
      return [
        { label: 'Aprobar y completar', next: 'completed', variant: 'approve' },
        { label: 'Pedir revisión', next: 'revision_requested', variant: 'reject' },
      ];
    default:
      return [];
  }
}

function getCreatorActions(status: UgcProjectStatus): { label: string; next: UgcProjectStatus; variant: 'approve' | 'reject' | 'neutral' }[] {
  switch (status) {
    case 'briefing_sent':
      return [
        { label: 'Aceptar proyecto', next: 'accepted', variant: 'approve' },
        { label: 'Rechazar', next: 'cancelled', variant: 'reject' },
      ];
    case 'accepted':
      return [{ label: 'Marcar en producción', next: 'in_production', variant: 'approve' }];
    case 'in_production':
      return [{ label: 'Entregar contenido', next: 'content_submitted', variant: 'approve' }];
    case 'revision_requested':
      return [{ label: 'Marcar en producción (revisión)', next: 'in_production', variant: 'neutral' }];
    default:
      return [];
  }
}

/* ─── Step indicator ────────────────────────────────────────────────────── */
function StepIndicator({ currentStatus }: { currentStatus: UgcProjectStatus }) {
  const currentIdx = STATUS_STEP_INDEX[currentStatus] ?? 0;
  const isCompleted = currentStatus === 'completed';
  const isCancelled = currentStatus === 'cancelled';
  const isDisputed = currentStatus === 'disputed';

  if (isCancelled || isDisputed) {
    return (
      <div className={`rounded-2xl p-4 border ${isCancelled ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className={isCancelled ? 'text-gray-500' : 'text-red-500'} />
          <span className={`font-semibold text-sm ${isCancelled ? 'text-gray-700' : 'text-red-700'}`}>
            {isCancelled ? 'Proyecto cancelado' : 'Proyecto en disputa'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Progreso del proyecto</h3>
      <div className="space-y-3">
        {STEPS.map((step, idx) => {
          const done = idx < currentIdx || isCompleted;
          const active = idx === currentIdx && !isCompleted;
          return (
            <div key={step.status} className="flex items-start gap-3">
              <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  done ? 'bg-emerald-500 border-emerald-500' :
                  active ? 'bg-violet-600 border-violet-600 ring-4 ring-violet-100' :
                  'bg-white border-gray-200'
                }`}>
                  {done ? (
                    <CheckCircle size={14} className="text-white" strokeWidth={2.5} />
                  ) : active ? (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-0.5 h-5 mt-1 ${done ? 'bg-emerald-300' : 'bg-gray-100'}`} />
                )}
              </div>
              <div className={`pb-2 ${active ? '' : ''}`}>
                <div className={`text-sm font-semibold leading-tight ${done ? 'text-emerald-700' : active ? 'text-violet-700' : 'text-gray-400'}`}>
                  {step.label}
                  {active && <span className="ml-2 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">Actual</span>}
                  {step.status === 'revision_requested' && currentStatus === 'revision_requested' && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Cambios pedidos</span>
                  )}
                </div>
                {active && <div className="text-xs text-gray-400 mt-0.5">{step.desc}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function UgcProjectPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<UgcProject | null>(null);
  const [deliveries, setDeliveries] = useState<UgcDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [paying, setPaying] = useState(false);

  const userType = (user?.user_metadata?.user_type as string | undefined) ?? null;
  const isBrand = userType === 'brand';

  useEffect(() => {
    if (!params.id) return;
    Promise.all([
      getUgcProject(params.id),
      getUgcDeliveries(params.id),
    ]).then(([proj, dels]) => {
      setProject(proj);
      setDeliveries(dels);
    }).finally(() => setLoading(false));
  }, [params.id]);

  const handlePayment = async () => {
    if (!project?.creator_id || !project.budget_cents || !user?.id) return;
    setPaying(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payer_user_id: user.id,
          payee_user_id: project.creator_id,
          amount_cents: project.budget_cents,
          project_type: 'ugc',
          project_id: project.id,
        }),
      });
      const { url, error } = await res.json() as { url?: string; error?: string };
      if (url) window.location.href = url;
      else { console.error(error); setPaying(false); }
    } catch (e) {
      console.error(e);
      setPaying(false);
    }
  };

  const handleTransition = async (next: UgcProjectStatus) => {
    if (!project) return;
    setTransitioning(true);
    try {
      await updateUgcProjectStatus(project.id, next);
      setProject(prev => prev ? { ...prev, status: next } : prev);
    } catch (e) {
      console.error(e);
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-2xl">🔍</div>
        <div className="text-sm text-gray-600 font-medium">Proyecto no encontrado</div>
        <Link href="/dashboard/brand" className="text-xs text-violet-600 underline">Volver al dashboard</Link>
      </div>
    );
  }

  const actions = isBrand ? getBrandActions(project.status) : getCreatorActions(project.status);
  const isFinished = TERMINAL_STATUSES.includes(project.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-gray-900 truncate">{project.title}</h1>
        <div className="flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-2.5 py-1.5 rounded-full flex-shrink-0">
          <Video size={12} /> UGC
        </div>
      </div>

        {/* Stepper */}
        <StepIndicator currentStatus={project.status} />

        {/* Acciones principales */}
        {!isFinished && actions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              {isBrand ? 'Acciones como marca' : 'Acciones como creador'}
            </h3>
            <div className="flex flex-col gap-2">
              {actions.map(action => (
                <button
                  key={action.next}
                  onClick={() => handleTransition(action.next)}
                  disabled={transitioning}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                    action.variant === 'approve'
                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                      : action.variant === 'reject'
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {action.variant === 'approve' && <CheckCircle size={15} />}
                  {action.variant === 'reject' && (action.next === 'revision_requested' ? <RotateCcw size={15} /> : <AlertCircle size={15} />)}
                  {action.variant === 'neutral' && <Send size={15} />}
                  {transitioning ? 'Procesando...' : action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pago del proyecto */}
        {isBrand && project.status === 'accepted' && project.budget_cents && project.creator_id && (
          <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Pago del proyecto</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-600">Presupuesto acordado</div>
                <div className="text-2xl font-bold text-gray-900">{(project.budget_cents / 100).toFixed(2)} €</div>
                <div className="text-xs text-gray-400 mt-0.5">El pago se retiene en escrow 7 días tras la aprobación</div>
              </div>
            </div>
            <button
              onClick={handlePayment}
              disabled={paying}
              className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CreditCard size={15} />
              {paying ? 'Redirigiendo a Stripe...' : 'Pagar proyecto'}
            </button>
          </div>
        )}

        {/* Estado completado */}
        {project.status === 'completed' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <div className="text-sm font-bold text-emerald-800">¡Proyecto completado!</div>
            <div className="text-xs text-emerald-600 mt-1">El contenido ha sido entregado y aprobado</div>
          </div>
        )}

        {/* Entregas del creador */}
        {deliveries.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              Entregas del creador
              <span className="ml-2 text-xs text-gray-400 font-normal">{deliveries.length} entrega{deliveries.length > 1 ? 's' : ''}</span>
            </h3>
            <div className="space-y-3">
              {deliveries.map((del, idx) => (
                <div key={del.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700">Entrega #{idx + 1}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {del.format && <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{del.format}</span>}
                      {del.duration_seconds && <span><Clock size={11} className="inline mr-0.5" />{del.duration_seconds}s</span>}
                      <span>Ronda {del.revision_round}</span>
                    </div>
                  </div>
                  {del.notes && <p className="text-xs text-gray-500 mb-3 italic">"{del.notes}"</p>}
                  {del.content_urls.length > 0 && (
                    <div className="space-y-1.5">
                      {del.content_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-violet-600 hover:text-violet-700 font-medium bg-white rounded-lg px-3 py-2 border border-violet-100"
                        >
                          <ExternalLink size={12} />
                          <span className="truncate">{url}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detalles del briefing */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Detalles del briefing</h3>

          {project.description && (
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-1">Descripción</div>
              <p className="text-sm text-gray-700">{project.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-1">Tipos de contenido</div>
              <div className="flex flex-wrap gap-1.5">
                {project.content_types.map(ct => (
                  <span key={ct} className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                    {CONTENT_TYPE_ICONS[ct]} {ct}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-1">Derechos de uso</div>
              <span className="text-sm text-gray-700">{USAGE_LABELS[project.usage_rights]}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-base font-bold text-gray-900">{project.deliverables_count}</div>
              <div className="text-xs text-gray-400">Entregables</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-base font-bold text-gray-900">
                {project.budget_cents ? `${(project.budget_cents / 100).toFixed(0)}€` : '—'}
              </div>
              <div className="text-xs text-gray-400">Presupuesto</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-base font-bold text-gray-900">{project.revision_limit}</div>
              <div className="text-xs text-gray-400">Revisiones</div>
            </div>
          </div>

          {project.deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={14} className="text-gray-400" />
              Fecha límite: <span className="font-semibold">{new Date(project.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}

          {project.reference_urls.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-1.5">Referencias</div>
              <div className="space-y-1.5">
                {project.reference_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-violet-600 hover:text-violet-700 bg-violet-50 rounded-lg px-3 py-2">
                    <ExternalLink size={11} /><span className="truncate">{url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {project.notes && (
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-1">Notas del briefing</div>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{project.notes}</p>
            </div>
          )}
        </div>

    </div>
  );
}
