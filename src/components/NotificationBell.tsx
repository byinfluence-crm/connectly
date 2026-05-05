'use client';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Euro, Star, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import type { AppNotification } from '@/lib/supabase';

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function getNotifHref(notif: AppNotification): string {
  const d = notif.data;
  switch (notif.type) {
    case 'offer_received':
    case 'offer_response':
      if (d.application_id) return `/chat/${d.application_id}`;
      if (d.conversation_id) return `/chat/direct/${d.conversation_id}`;
      return '/dashboard';
    case 'pending_brand_review':
      return '/dashboard/brand/collabs';
    case 'review_published':
      return '/dashboard/creator/analytics';
    case 'application_accepted':
      return d.application_id ? `/chat/${d.application_id}` : '/dashboard';
    default:
      return '/dashboard';
  }
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'offer_received') return <Euro size={14} className="text-emerald-600" />;
  if (type === 'offer_response') return <CheckCircle size={14} className="text-violet-600" />;
  if (type === 'pending_brand_review') return <Star size={14} className="text-amber-500" />;
  if (type === 'review_published') return <Star size={14} className="text-violet-600" />;
  if (type === 'application_accepted') return <FileText size={14} className="text-emerald-600" />;
  return <Bell size={14} className="text-gray-400" />;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  // Cierre al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = async (notif: AppNotification) => {
    if (!notif.read) await markRead(notif.id);
    setOpen(false);
    router.push(getNotifHref(notif));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-900">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-violet-600 font-semibold hover:text-violet-700"
              >
                Marcar todo leído
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-violet-50/40' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${!notif.read ? 'bg-violet-100' : 'bg-gray-100'}`}>
                    <NotifIcon type={notif.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug">{notif.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatRelative(notif.created_at)}</p>
                  </div>
                  {!notif.read && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-violet-500 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
