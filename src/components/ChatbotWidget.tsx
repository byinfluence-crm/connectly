'use client';
import { useState } from 'react';
import {
  MessageCircle, X, ArrowLeft, ChevronRight,
  Store, Star, ShieldCheck, Zap, HelpCircle,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Role = 'brand' | 'creator';
type Screen = 'role' | 'questions' | 'answer';

interface QA {
  q: string;
  a: string;
}

interface Category {
  label: string;
  icon: React.ReactNode;
  items: QA[];
}

// ─── Contenido Q&A ───────────────────────────────────────────────────────────

const BRAND_CATEGORIES: Category[] = [
  {
    label: 'Cómo empezar',
    icon: <Store size={14} />,
    items: [
      {
        q: '¿Cómo publico una colaboración?',
        a: 'Accede a tu dashboard de marca y pulsa "Nueva colaboración". Rellena el briefing: tipo de contenido, nicho, ciudad, presupuesto y fecha límite. Tu colaboración queda activa al instante y los creadores pueden aplicar.\n\nSi necesitas candidatos rápido, activa un boost de urgencia: tu colaboración aparecerá en las primeras posiciones con badge "Urgente" para atraer perfiles en horas.',
      },
      {
        q: '¿Cómo elijo al influencer adecuado?',
        a: 'Cuando los creadores apliquen verás su perfil con seguidores, engagement rate, nicho, ciudad y reseñas de otras marcas. Puedes revisar su perfil público completo antes de aceptar o rechazar.\n\nUsa los filtros de Discover para buscar perfiles por ciudad, nicho o tamaño de audiencia. Los perfiles desbloqueados muestran también email y teléfono de contacto.',
      },
      {
        q: '¿Qué tipos de colaboración puedo crear?',
        a: 'Puedes crear tres tipos:\n\n• Pago — remuneras económicamente al influencer. Se activa el sistema de escrow automáticamente.\n• Canje — ofreces producto o servicio a cambio de contenido.\n• Mixto — pago + producto. También activa el escrow para la parte económica.',
      },
    ],
  },
  {
    label: 'Pagos y seguridad',
    icon: <ShieldCheck size={14} />,
    items: [
      {
        q: '¿Cómo funciona el pago y el seguro?',
        a: 'Connectly usa un sistema de escrow (depósito en garantía), igual que Wallapop o Vinted.\n\nAl confirmar un influencer en una colaboración de pago, abonas el importe a Connectly. El dinero queda retenido hasta que ambas partes confirmen que la colaboración se realizó correctamente:\n\n① Influencer sube publicaciones + estadísticas\n② Tú confirmas la entrega\n③ El pago se libera al influencer\n\nConnectly retiene una comisión del servicio que es irretornable en cualquier caso.',
      },
      {
        q: '¿Qué pasa si el influencer no cumple?',
        a: 'Si el influencer no entrega el contenido acordado o lo hace de forma incorrecta, puedes abrir un expediente desde tu dashboard.\n\nConnectly revisa el caso analizando:\n• Las publicaciones entregadas\n• El historial del chat\n• El briefing acordado originalmente\n\nLa comisión de Connectly no se devuelve en ningún caso. El resto del importe puede reembolsarse si la resolución es a tu favor.',
      },
      {
        q: '¿Cómo sé que la colaboración se realizó?',
        a: 'Al finalizar, el influencer debe subir directamente en Connectly:\n\n• Los enlaces a sus publicaciones (post, reel, story, TikTok…)\n• Las estadísticas de rendimiento: alcance, impresiones, interacciones\n• Para historias: vistas y clics en enlace\n\nRecibes una notificación para revisar la entrega. Solo cuando tú confirmas, el pago se libera. Nadie cobra sin que hayas dado el visto bueno.',
      },
      {
        q: '¿Qué porcentaje se queda Connectly?',
        a: 'Connectly retiene una comisión del importe bruto de la colaboración en concepto de seguro y gestión de la plataforma. Esta comisión es irretornable independientemente del resultado — tanto si la colaboración se completa como si se abre un expediente.\n\nEl porcentaje exacto se muestra al crear cada colaboración de pago. Próximamente podrás verlo en detalle en la sección de Precios.',
      },
    ],
  },
  {
    label: 'Visibilidad y boosts',
    icon: <Zap size={14} />,
    items: [
      {
        q: '¿Puedo aparecer primero en los resultados?',
        a: 'Sí. Los boosts de visibilidad para marcas te permiten:\n\n• Aparecer en las primeras posiciones de discover\n• Mostrar badge "Urgente" o "Destacada" en tu colaboración\n• Atraer candidatos rápidamente para campañas con fecha límite\n\nEs un pago puntual, sin suscripción. Ideal para cuando tienes una campaña para ya y necesitas perfiles en 48-72 horas.',
      },
      {
        q: '¿Cómo funcionan los créditos?',
        a: 'Los créditos se usan para desbloquear perfiles de influencers y ver sus datos de contacto completos: nombre real, email y teléfono.\n\n• Cada perfil desbloqueado cuesta 10 créditos\n• Los perfiles quedan desbloqueados de forma permanente — no vuelves a gastar créditos por el mismo perfil\n• Con un plan de suscripción tienes desbloqueos ilimitados\n\nPuedes comprar créditos desde la sección Precios.',
      },
    ],
  },
  {
    label: 'Reseñas',
    icon: <Star size={14} />,
    items: [
      {
        q: '¿Cómo funciona el sistema de reseñas?',
        a: 'Al cerrar una colaboración, el sistema de reseñas es obligatorio para ambas partes:\n\n① El influencer deja una reseña sobre su experiencia contigo\n② Recibes una notificación: "El influencer ha dejado una reseña"\n③ Para poder ver esa reseña, debes dejar también la tuya\n④ Ambas reseñas se publican simultáneamente\n\nEsto garantiza que ninguna parte influye en la otra. Las reseñas son públicas y aparecen en los perfiles de marca e influencer.',
      },
    ],
  },
];

const CREATOR_CATEGORIES: Category[] = [
  {
    label: 'Cómo funciona',
    icon: <HelpCircle size={14} />,
    items: [
      {
        q: '¿Cómo aplico a una colaboración?',
        a: 'Navega a Discover, filtra las colaboraciones por nicho o ciudad y pulsa "Aplicar" en las que te interesen. Puedes añadir un mensaje personalizado a la marca para destacar entre los candidatos.\n\nLa marca revisará tu perfil y decidirá si aceptar o rechazar tu candidatura. Si te aceptan, se abre un chat directo con la marca para coordinar los detalles.',
      },
      {
        q: '¿Puedo aplicar a varias colaboraciones a la vez?',
        a: 'Sí, puedes aplicar a todas las colaboraciones que quieras simultáneamente.\n\nTe recomendamos personalizar el mensaje para cada una — las marcas ven ese mensaje y marca la diferencia frente a otros candidatos. Puedes seguir el estado de todas tus aplicaciones desde tu dashboard de creador.',
      },
    ],
  },
  {
    label: 'Pagos y garantías',
    icon: <ShieldCheck size={14} />,
    items: [
      {
        q: '¿Cuándo y cómo me pagan?',
        a: 'Para colaboraciones con pago, la marca deposita el importe en escrow (garantía) al confirmarte como candidato. El dinero queda retenido de forma segura hasta que ambas partes confirméis que la colaboración se realizó.\n\n① Subes tus publicaciones + estadísticas a Connectly\n② La marca confirma la entrega\n③ El pago se libera a tu cuenta\n\nConnectly retiene una comisión del servicio del importe bruto.',
      },
      {
        q: '¿Connectly garantiza mi pago?',
        a: 'Sí. El sistema de escrow asegura que el dinero ya está depositado antes de que empieces la colaboración.\n\nNo dependes de que la marca te pague a posteriori — el importe ya está reservado en la plataforma desde el momento en que te confirman. Solo se libera cuando la colaboración se confirma correctamente.',
      },
      {
        q: '¿Qué pasa si la marca no confirma la colaboración?',
        a: 'Si has entregado todo correctamente y la marca no confirma en el plazo establecido, puedes abrir un expediente desde tu dashboard.\n\nConnectly revisará las evidencias:\n• Tus publicaciones y estadísticas subidas\n• El historial del chat con la marca\n• El briefing acordado\n\nLa plataforma protege a los creadores que han cumplido con lo acordado.',
      },
      {
        q: '¿Qué tengo que entregar al finalizar?',
        a: 'Al finalizar la colaboración debes subir a Connectly:\n\n• Los enlaces directos a tus publicaciones (post, reel, story, TikTok…)\n• Estadísticas: alcance, impresiones e interacciones\n• Para historias: vistas, clics en enlace y respuestas\n• Fecha de publicación de cada pieza\n\nEsto activa la revisión de la marca y, si aprueba, la liberación del pago.',
      },
    ],
  },
  {
    label: 'Visibilidad y boosts',
    icon: <Zap size={14} />,
    items: [
      {
        q: '¿Cómo mejoro mi visibilidad en Connectly?',
        a: 'Tres formas de destacar:\n\n① Completa tu perfil al 100% — bio, nicho, ciudad y portfolio\n② Acumula reseñas positivas de las marcas con las que colaboras\n③ Activa un boost de visibilidad para aparecer en las primeras posiciones de búsqueda de marcas\n\nLas reseñas son el factor más valorado. Un perfil con 5 estrellas consistentes atrae colaboraciones de forma orgánica.',
      },
      {
        q: '¿Qué son los boosts y cómo funcionan?',
        a: 'Los boosts son un sistema de promoción interna de pago puntual.\n\nAl activar un boost, tu perfil:\n• Aparece destacado en las búsquedas de marcas\n• Muestra badge "Top creador" o "Destacado"\n• Tiene mayor visibilidad durante el período del boost\n\nEs un pago puntual — no es una suscripción. Lo activas solo cuando quieres aumentar tu flujo de colaboraciones en un momento concreto.',
      },
      {
        q: '¿Cómo funcionan los créditos?',
        a: 'Los créditos los usan las marcas para desbloquear tu perfil y ver tus datos de contacto. Tú como creador no gastas créditos.\n\nCada vez que una marca desbloquea tu perfil significa que ya hay interés real en ti. Tu información de contacto queda visible para esa marca de forma permanente.',
      },
    ],
  },
  {
    label: 'Reseñas',
    icon: <Star size={14} />,
    items: [
      {
        q: '¿Cómo funciona el sistema de reseñas?',
        a: 'Al finalizar una colaboración, debes dejar una reseña obligatoria sobre la marca antes de poder cerrar la colaboración.\n\n① Dejas tu reseña sobre la marca\n② La marca recibe una notificación\n③ Para ver tu reseña, la marca debe dejar también la suya\n④ Ambas reseñas se publican simultáneamente\n\nNinguna parte puede ver la reseña de la otra sin haber dejado primero la suya. Esto elimina los sesgos y garantiza honestidad.',
      },
    ],
  },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [screen, setScreen] = useState<Screen>('role');
  const [activeQA, setActiveQA] = useState<QA | null>(null);

  const categories = role === 'brand' ? BRAND_CATEGORIES : CREATOR_CATEGORIES;

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setScreen('questions');
  };

  const handleQuestion = (qa: QA) => {
    setActiveQA(qa);
    setScreen('answer');
  };

  const handleBack = () => {
    if (screen === 'answer') {
      setScreen('questions');
      setActiveQA(null);
    } else if (screen === 'questions') {
      setScreen('role');
      setRole(null);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setScreen('role');
      setRole(null);
      setActiveQA(null);
    }, 300);
  };

  const headerTitle = screen === 'role'
    ? 'Hola, ¿cómo podemos ayudarte?'
    : screen === 'questions'
    ? role === 'brand' ? 'Preguntas para marcas' : 'Preguntas para creadores'
    : 'Respuesta';

  return (
    <>
      {/* ── Botón flotante ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Abrir ayuda"
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-200 ${
          open
            ? 'bg-gray-800 text-white'
            : 'bg-violet-600 text-white hover:bg-violet-700 hover:shadow-xl hover:scale-105'
        }`}
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
        <span className="text-sm font-semibold">{open ? 'Cerrar' : 'Ayuda'}</span>
      </button>

      {/* ── Panel ── */}
      <div
        className={`fixed bottom-20 right-5 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ maxHeight: 'calc(100vh - 120px)', height: '580px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            {screen !== 'role' && (
              <button
                onClick={handleBack}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors mr-0.5"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex-1">
              <div className="text-white font-bold text-sm">{headerTitle}</div>
              {screen === 'role' && (
                <div className="text-violet-200 text-xs mt-0.5">
                  Soporte de Connectly · respuesta instantánea
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Pantalla: selector de rol ── */}
          {screen === 'role' && (
            <div className="p-5">
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Selecciona tu perfil para ver las preguntas más relevantes para ti:
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => handleRoleSelect('brand')}
                  className="w-full flex items-center gap-4 p-4 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-2xl transition-colors text-left group"
                >
                  <div className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                    <Store size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900">Soy una marca</div>
                    <div className="text-xs text-gray-500">Busco influencers para colaborar</div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-violet-600 transition-colors" />
                </button>

                <button
                  onClick={() => handleRoleSelect('creator')}
                  className="w-full flex items-center gap-4 p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-2xl transition-colors text-left group"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Star size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900">Soy creador/a</div>
                    <div className="text-xs text-gray-500">Quiero conseguir colaboraciones</div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">o escríbenos</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <a
                href="mailto:hola@connectly.es"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium"
              >
                📧 hola@connectly.es
              </a>
            </div>
          )}

          {/* ── Pantalla: lista de preguntas ── */}
          {screen === 'questions' && (
            <div className="divide-y divide-gray-50">
              {categories.map(cat => (
                <div key={cat.label} className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    <span className={role === 'brand' ? 'text-violet-500' : 'text-emerald-500'}>{cat.icon}</span>
                    {cat.label}
                  </div>
                  <div className="space-y-1">
                    {cat.items.map(qa => (
                      <button
                        key={qa.q}
                        onClick={() => handleQuestion(qa)}
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900 leading-snug">
                          {qa.q}
                        </span>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Footer categorías */}
              <div className="px-4 py-4">
                <a
                  href="mailto:hola@connectly.es"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gray-50 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  ¿No encuentras tu respuesta? Escríbenos →
                </a>
              </div>
            </div>
          )}

          {/* ── Pantalla: respuesta ── */}
          {screen === 'answer' && activeQA && (
            <div className="p-5">
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-3 ${
                role === 'brand' ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {role === 'brand' ? <Store size={11} /> : <Star size={11} />}
                {role === 'brand' ? 'Para marcas' : 'Para creadores'}
              </div>

              <h3 className="text-sm font-bold text-gray-900 leading-snug mb-4">
                {activeQA.q}
              </h3>

              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {activeQA.a}
              </div>

              {/* CTA contextual */}
              <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                <button
                  onClick={handleBack}
                  className="w-full py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm text-gray-600 font-medium transition-colors"
                >
                  ← Ver más preguntas
                </button>
                <a
                  href="mailto:hola@connectly.es"
                  className="flex items-center justify-center w-full py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm text-gray-500 transition-colors"
                >
                  ¿Necesitas más ayuda? Escríbenos
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Footer con badge de seguridad */}
        <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50 flex-shrink-0">
          <p className="text-center text-[10px] text-gray-300">
            🔒 Connectly · Plataforma segura para marcas e influencers
          </p>
        </div>
      </div>
    </>
  );
}
