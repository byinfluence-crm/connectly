'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import { dismissContactRequest, getDirectConversationsForUser } from '@/lib/supabase';
import type { ContactRequest, DirectConversationEnriched } from '@/lib/supabase';
import { MessageCircle, Loader2, X, Building2, MessagesSquare } from 'lucide-react';
import type { InboxItem } from '@/app/api/messages/inbox/route';

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return 'ahora';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
      {icon} {label}
    </h2>
  );
}

export default function MessagesInbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [directConvs, setDirectConvs] = useState<DirectConversationEnriched[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const userType = (user?.user_metadata?.user_type as string | undefined) ?? null;

  useEffect(() => {
    if (!user) return;

    const fetches: Promise<void>[] = [
      authFetch('/api/messages/inbox')
        .then(r => r.json())
        .then(d => setItems(d.items ?? [])),

      getDirectConversationsForUser(user.id)
        .then(setDirectConvs),
    ];

    if (userType === 'influencer') {
      fetches.push(
        authFetch('/api/contact')
          .then(r => r.json())
          .then(d => setContactRequests(
            (d.requests ?? []).filter((r: ContactRequest) => r.status === 'pending'),
          )),
      );
    }

    Promise.all(fetches).finally(() => setLoading(false));
  }, [user, userType]);

  const handleDismiss = async (id: string) => {
    await dismissContactRequest(id);
    setContactRequests(prev => prev.filter(r => r.id !== id));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-violet-600" />
      </div>
    );
  }

  const hasAnything = items.length > 0 || directConvs.length > 0 || contactRequests.length > 0;
  const totalCount = items.length + directConvs.length + contactRequests.length;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {hasAnything ? `${totalCount} conversación${totalCount !== 1 ? 'es' : ''}` : 'Sin mensajes aún'}
        </p>
      </div>

      {!hasAnything ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <MessageCircle size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="font-medium text-gray-500">No tienes conversaciones aún</p>
          <p className="text-sm text-gray-400 mt-1">
            {userType === 'brand'
              ? 'Desbloquea perfiles de creadores para iniciar chats directos'
              : 'Aquí aparecerán tus chats cuando las marcas contacten contigo'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Chats directos ── */}
          {directConvs.length > 0 && (
            <section>
              <SectionLabel
                icon={<MessagesSquare size={12} />}
                label="Chats directos"
              />
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 shadow-sm">
                {directConvs.map(conv => (
                  <Link
                    key={conv.id}
                    href={`/chat/direct/${conv.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold">
                      {conv.other_avatar
                        ? <img src={conv.other_avatar} className="w-full h-full object-cover" alt="" />
                        : conv.other_name.charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 truncate text-sm">{conv.other_name}</p>
                        {conv.last_message_at && (
                          <span className="text-xs text-gray-400 shrink-0">{timeAgo(conv.last_message_at)}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-violet-500 font-medium mb-0.5">Chat directo</p>
                      {conv.last_message_content ? (
                        <p className="text-sm text-gray-500 truncate">
                          {conv.last_message_mine && <span className="text-gray-400">Tú: </span>}
                          {conv.last_message_content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Sin mensajes · Empieza la conversación</p>
                      )}
                    </div>
                    <span className="text-gray-300 text-xl shrink-0 group-hover:text-violet-400 transition-colors">›</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Solicitudes directas (solo creadores) ── */}
          {contactRequests.length > 0 && (
            <section>
              <SectionLabel
                icon={<Building2 size={12} />}
                label="Solicitudes de marcas"
              />
              <div className="space-y-2">
                {contactRequests.map(req => (
                  <div key={req.id} className="bg-white border border-violet-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold">
                        {req.other_logo
                          ? <img src={req.other_logo} className="w-full h-full object-cover" alt="" />
                          : req.other_name.charAt(0).toUpperCase()
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">{req.other_name}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs text-gray-400">{timeAgo(req.created_at)}</span>
                            <button
                              onClick={() => handleDismiss(req.id)}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Descartar"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                        <span className="text-[10px] bg-violet-50 text-violet-600 font-semibold px-2 py-0.5 rounded-full">Solicitud directa</span>
                        {req.message ? (
                          <p className="text-sm text-gray-600 leading-relaxed mt-1.5">{req.message}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic mt-1.5">Sin mensaje adicional</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Chats de colaboración ── */}
          {items.length > 0 && (
            <section>
              <SectionLabel
                icon={<MessageCircle size={12} />}
                label="Colaboraciones"
              />
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 shadow-sm">
                {items.map(item => (
                  <Link
                    key={item.application_id}
                    href={`/chat/${item.application_id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold">
                      {item.other_avatar
                        ? <img src={item.other_avatar} className="w-full h-full object-cover" alt="" />
                        : item.other_name.charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 truncate text-sm">{item.other_name}</p>
                        {item.last_message_at && (
                          <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.last_message_at)}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mb-1">{item.collab_title}</p>
                      {item.last_message_content ? (
                        <p className="text-sm text-gray-500 truncate">
                          {item.last_message_mine && <span className="text-gray-400">Tú: </span>}
                          {item.last_message_content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Sin mensajes · Empieza la conversación</p>
                      )}
                    </div>
                    <span className="text-gray-300 text-xl shrink-0 group-hover:text-gray-400 transition-colors">›</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
