'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, ShieldAlert, Lock, Euro, Handshake } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useChat, containsBlockedContent } from '@/lib/hooks/useChat';
import { getApplicationById, sendOffer, respondToOffer, getUserPlan, type PlanTier } from '@/lib/supabase';
import OfferBubble from '@/components/OfferBubble';

type AppInfo = Awaited<ReturnType<typeof getApplicationById>>;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
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

interface ActionPanelProps {
  otherName: string;
  planTier: PlanTier;
  offerAmount: string;
  offerDesc: string;
  sendingOffer: boolean;
  sendingConnect: boolean;
  onOfferAmountChange: (v: string) => void;
  onOfferDescChange: (v: string) => void;
  onConnect: () => void;
  onSendOffer: () => void;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
}

function ActionPanel({
  otherName, planTier, offerAmount, offerDesc, sendingOffer, sendingConnect,
  onOfferAmountChange, onOfferDescChange, onConnect, onSendOffer, onClose, router,
}: ActionPanelProps) {
  const canAct = planTier !== 'free';

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl mb-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-bold text-gray-800">¿Qué quieres hacer?</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs font-medium">Cerrar</button>
      </div>

      {/* Conectar */}
      <div className="relative px-4 py-3 border-b border-gray-100">
        <div className={!canAct ? 'opacity-40 pointer-events-none select-none' : ''}>
          <div className="flex items-center gap-2 mb-1">
            <Handshake size={14} className="text-violet-600" />
            <span className="text-sm font-semibold text-gray-800">Conectar</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Saluda a {otherName} e inicia la conversación sin proponer precio.
          </p>
          <button
            onClick={onConnect}
            disabled={sendingConnect}
            className="w-full py-2 rounded-xl text-xs font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors disabled:opacity-50"
          >
            {sendingConnect ? 'Enviando…' : 'Conectar →'}
          </button>
        </div>
        {!canAct && (
          <button
            onClick={() => router.push('/pricing')}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/60 rounded-none"
          >
            <Lock size={14} className="text-gray-500" />
            <span className="text-xs font-semibold text-gray-600">Plan Starter — desde 29€/mes</span>
          </button>
        )}
      </div>

      {/* Lanzar propuesta */}
      <div className="relative px-4 py-3">
        <div className={!canAct ? 'opacity-40 pointer-events-none select-none' : ''}>
          <div className="flex items-center gap-2 mb-1">
            <Euro size={14} className="text-emerald-600" />
            <span className="text-sm font-semibold text-gray-800">Lanzar propuesta</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">Propón directamente una cifra a {otherName}.</p>
          <div className="space-y-2 mb-3">
            <input
              type="number"
              value={offerAmount}
              onChange={e => onOfferAmountChange(e.target.value)}
              placeholder="Importe (€)"
              min="1"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <textarea
              value={offerDesc}
              onChange={e => onOfferDescChange(e.target.value)}
              placeholder="Descripción opcional (ej. 2 posts + stories)"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={onSendOffer}
            disabled={!offerAmount || parseFloat(offerAmount) <= 0 || sendingOffer}
            className="w-full py-2 rounded-xl text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {sendingOffer ? 'Enviando…' : 'Lanzar propuesta →'}
          </button>
        </div>
        {!canAct && (
          <button
            onClick={() => router.push('/pricing')}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/60 rounded-none"
          >
            <Lock size={14} className="text-gray-500" />
            <span className="text-xs font-semibold text-gray-600">Plan Starter — desde 29€/mes</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [appInfo, setAppInfo] = useState<AppInfo>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [planTier, setPlanTier] = useState<PlanTier>('free');
  const [input, setInput] = useState('');
  const [phoneWarning, setPhoneWarning] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const [showPanel, setShowPanel] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);
  const [sendingConnect, setSendingConnect] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, loading: loadingMsgs, sending, send, refresh } = useChat(
    applicationId,
    user?.id ?? '',
  );

  useEffect(() => {
    if (!applicationId) return;
    getApplicationById(applicationId)
      .then(data => {
        setAppInfo(data);
        if (data && data.status !== 'accepted') router.replace('/dashboard');
      })
      .catch(() => router.replace('/dashboard'))
      .finally(() => setLoadingInfo(false));
  }, [applicationId, router]);

  useEffect(() => {
    if (!user?.id) return;
    getUserPlan(user.id).then(p => setPlanTier(p.plan)).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    setPhoneWarning(containsBlockedContent(val));
    if (blocked) setBlocked(false);
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    const result = await send(content);
    if (result.blocked) { setBlocked(true); return; }
    setInput('');
    setPhoneWarning(false);
    setBlocked(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (authLoading || loadingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appInfo) return null;

  const isCreator = user?.id === appInfo.creator?.user_id;
  const otherName = isCreator
    ? appInfo.brand?.display_name ?? 'Marca'
    : appInfo.creator?.display_name ?? 'Creador';
  const collabTitle = appInfo.collab?.title ?? '';
  const receiverUserId = isCreator ? appInfo.brand_id : (appInfo.creator?.user_id ?? '');

  const handleConnect = async () => {
    setSendingConnect(true);
    try {
      await send(`¡Hola ${otherName}! Me gustaría coordinar los detalles de nuestra colaboración 👋`);
      setShowPanel(false);
    } finally {
      setSendingConnect(false);
    }
  };

  const handleSendOffer = async () => {
    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0 || !user?.id || !receiverUserId) return;
    setSendingOffer(true);
    try {
      await sendOffer({ applicationId, senderUserId: user.id, receiverUserId, amount, description: offerDesc.trim() || undefined });
      setShowPanel(false);
      setOfferAmount('');
      setOfferDesc('');
    } catch (err) {
      console.error('sendOffer error:', err);
    } finally {
      setSendingOffer(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!user?.id) return;
    await respondToOffer({ offerId, response: 'accepted', applicationId, senderUserId: user.id });
    await refresh();
  };

  const handleRejectOffer = async (offerId: string) => {
    if (!user?.id) return;
    await respondToOffer({ offerId, response: 'rejected', applicationId, senderUserId: user.id });
    await refresh();
  };

  const grouped: { date: string; msgs: typeof messages }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.date === date) last.msgs.push(msg);
    else grouped.push({ date, msgs: [msg] });
  }

  const backHref = isCreator ? '/dashboard/creator' : '/dashboard/brand';

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={backHref} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {otherName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{otherName}</div>
            {collabTitle && <div className="text-xs text-gray-400 truncate">{collabTitle}</div>}
          </div>
          <div className="flex items-center gap-1 text-xs text-violet-600 font-medium bg-violet-50 px-2.5 py-1 rounded-full flex-shrink-0">
            <Lock size={10} /> Seguro
          </div>
        </div>
      </div>

      {/* Aviso de política */}
      <div className="bg-amber-50 border-b border-amber-100 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-start gap-2 text-xs text-amber-700">
          <ShieldAlert size={13} className="flex-shrink-0 mt-0.5" />
          <span>Toda comunicación debe ocurrir dentro de Connectly. No compartas datos de contacto.</span>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-1">
          {loadingMsgs ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">👋</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Empieza la conversación con {otherName}</div>
              <div className="text-xs text-gray-400">Coordinad los detalles de la colaboración aquí</div>
            </div>
          ) : (
            grouped.map(({ date, msgs }) => (
              <div key={date}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium px-2">{date}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                {msgs.map((msg, i) => {
                  const isMine = msg.sender_user_id === user?.id;
                  const prevMsg = msgs[i - 1];
                  const sameSender = prevMsg?.sender_user_id === msg.sender_user_id;
                  const isOffer = msg.message_type === 'offer' && msg.offer;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${sameSender && !isOffer ? 'mt-0.5' : 'mt-3'}`}>
                      <div className={`${isOffer ? 'max-w-[280px]' : 'max-w-[75%] sm:max-w-[60%]'} ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                        {isOffer && msg.offer ? (
                          <OfferBubble offer={msg.offer} isMine={isMine} onAccept={handleAcceptOffer} onReject={handleRejectOffer} />
                        ) : (
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-white text-gray-900 border border-gray-100 shadow-sm rounded-bl-sm'}`}>
                            {msg.content}
                          </div>
                        )}
                        {(i === msgs.length - 1 || msgs[i + 1]?.sender_user_id !== msg.sender_user_id) && (
                          <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.created_at)}</span>
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

      {/* Input */}
      <div className="bg-white border-t border-gray-100 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {showPanel && (
            <ActionPanel
              otherName={otherName}
              planTier={planTier}
              offerAmount={offerAmount}
              offerDesc={offerDesc}
              sendingOffer={sendingOffer}
              sendingConnect={sendingConnect}
              onOfferAmountChange={setOfferAmount}
              onOfferDescChange={setOfferDesc}
              onConnect={handleConnect}
              onSendOffer={handleSendOffer}
              onClose={() => setShowPanel(false)}
              router={router}
            />
          )}
          {(phoneWarning || blocked) && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-3">
              <ShieldAlert size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">
                <strong className="font-semibold">No está permitido compartir datos de contacto en el chat.</strong>{' '}
                Connectly no se hace responsable de acuerdos realizados fuera de la plataforma.
              </p>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowPanel(v => !v)}
              className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${showPanel ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title="Conectar o proponer"
            >
              <Euro size={16} />
            </button>
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
              className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${input.trim() && !sending && !phoneWarning ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-md hover:shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {sending ? <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-300 mt-2">Enter para enviar · Shift+Enter para nueva línea</p>
        </div>
      </div>
    </div>
  );
}
