'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, ShieldAlert, Lock } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useChat, containsPhone } from '@/lib/hooks/useChat';
import { getApplicationById } from '@/lib/supabase';

type AppInfo = Awaited<ReturnType<typeof getApplicationById>>;

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

export default function ChatPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [appInfo, setAppInfo] = useState<AppInfo>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [input, setInput] = useState('');
  const [phoneWarning, setPhoneWarning] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, loading: loadingMsgs, sending, send } = useChat(
    applicationId,
    user?.id ?? '',
  );

  // Cargar info de la aplicación
  useEffect(() => {
    if (!applicationId) return;
    getApplicationById(applicationId)
      .then(data => {
        setAppInfo(data);
        // Si la aplicación no está aceptada, redirigir
        if (data && data.status !== 'accepted') router.replace('/dashboard');
      })
      .catch(() => router.replace('/dashboard'))
      .finally(() => setLoadingInfo(false));
  }, [applicationId, router]);

  // Redirigir si no autenticado
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detectar teléfono en tiempo real mientras escribe
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    setPhoneWarning(containsPhone(val));
    if (blocked) setBlocked(false);
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;

    const result = await send(content);
    if (result.blocked) {
      setBlocked(true);
      return;
    }
    setInput('');
    setPhoneWarning(false);
    setBlocked(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || loadingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appInfo) return null;

  const isCreator = user?.id === appInfo.creator_id;
  const otherName = isCreator
    ? (appInfo.brand as { display_name: string } | null)?.display_name ?? 'Marca'
    : (appInfo.creator as { display_name: string } | null)?.display_name ?? 'Creador';
  const collabTitle = (appInfo.collab as { title: string } | null)?.title ?? '';

  // Agrupar mensajes por fecha
  const grouped: { date: string; msgs: typeof messages }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.date === date) {
      last.msgs.push(msg);
    } else {
      grouped.push({ date, msgs: [msg] });
    }
  }

  const backHref = isCreator ? '/dashboard/creator' : '/dashboard/brand';

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={backHref} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0">
            <ArrowLeft size={20} />
          </Link>

          {/* Avatar inicial */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {otherName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{otherName}</div>
            {collabTitle && (
              <div className="text-xs text-gray-400 truncate">{collabTitle}</div>
            )}
          </div>

          {/* Badge "Seguro" */}
          <div className="flex items-center gap-1 text-xs text-violet-600 font-medium bg-violet-50 px-2.5 py-1 rounded-full flex-shrink-0">
            <Lock size={10} /> Seguro
          </div>
        </div>
      </div>

      {/* ── Aviso de política ── */}
      <div className="bg-amber-50 border-b border-amber-100 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-start gap-2 text-xs text-amber-700">
          <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            Por seguridad, <strong>no compartas teléfonos ni emails</strong> en el chat.
            Toda la comunicación queda dentro de Connectly.
          </span>
        </div>
      </div>

      {/* ── Mensajes ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-1">

          {loadingMsgs ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">👋</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">
                Empieza la conversación con {otherName}
              </div>
              <div className="text-xs text-gray-400">
                Coordinad los detalles de la colaboración aquí
              </div>
            </div>
          ) : (
            grouped.map(({ date, msgs }) => (
              <div key={date}>
                {/* Separador de fecha */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium px-2">{date}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {msgs.map((msg, i) => {
                  const isMine = msg.sender_id === user?.id;
                  const prevMsg = msgs[i - 1];
                  const sameSender = prevMsg?.sender_id === msg.sender_id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${sameSender ? 'mt-0.5' : 'mt-3'}`}
                    >
                      <div className={`max-w-[75%] sm:max-w-[60%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-violet-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 border border-gray-100 shadow-sm rounded-bl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {/* Hora — solo en el último mensaje del grupo */}
                        {(i === msgs.length - 1 || msgs[i + 1]?.sender_id !== msg.sender_id) && (
                          <span className="text-[10px] text-gray-400 mt-1 px-1">
                            {formatTime(msg.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input ── */}
      <div className="bg-white border-t border-gray-100 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3">

          {/* Warning teléfono */}
          {(phoneWarning || blocked) && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2.5 text-xs text-red-700">
              <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                {blocked
                  ? 'Mensaje bloqueado — no está permitido compartir números de teléfono. Coordina la llamada desde la sección de videollamadas (próximamente).'
                  : 'Parece que el mensaje contiene un número de teléfono. No se podrá enviar.'
                }
              </span>
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje…"
              rows={1}
              className="flex-1 resize-none px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent max-h-32 overflow-y-auto"
              style={{ lineHeight: '1.4' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || phoneWarning}
              className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                input.trim() && !sending && !phoneWarning
                  ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                : <Send size={16} />
              }
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-300 mt-2">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
}
