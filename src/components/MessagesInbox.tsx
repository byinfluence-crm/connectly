'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import { MessageCircle, Loader2 } from 'lucide-react';
import type { InboxItem } from '@/app/api/messages/inbox/route';

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return 'ahora';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function MessagesInbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    authFetch('/api/messages/inbox')
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {items.length > 0
            ? `${items.length} conversación${items.length !== 1 ? 'es' : ''}`
            : 'Conversaciones de colaboraciones aceptadas'}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <MessageCircle size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="font-medium text-gray-500">No tienes conversaciones aún</p>
          <p className="text-sm text-gray-400 mt-1">
            Los chats se crean cuando una colaboración es aceptada
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {items.map(item => (
            <Link
              key={item.application_id}
              href={`/chat/${item.application_id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
                {item.other_avatar
                  ? <img src={item.other_avatar} className="w-full h-full object-cover" alt="" />
                  : item.other_name.charAt(0).toUpperCase()
                }
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <p className="font-semibold text-gray-900 truncate">{item.other_name}</p>
                  {item.last_message_at && (
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.last_message_at)}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mb-1">{item.collab_title}</p>
                {item.last_message_content ? (
                  <p className="text-sm text-gray-500 truncate">
                    {item.last_message_mine && (
                      <span className="text-gray-400">Tú: </span>
                    )}
                    {item.last_message_content}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sin mensajes · Empieza la conversación</p>
                )}
              </div>

              {/* Arrow */}
              <span className="text-gray-300 text-xl shrink-0 group-hover:text-gray-400 transition-colors">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
