'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase, getNotifications, markNotificationRead } from '@/lib/supabase';
import type { AppNotification } from '@/lib/supabase';

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!userId) return;
    getNotifications(userId).then(setNotifications).catch(console.error);
  }, [userId]);

  // Realtime: nuevas notificaciones en tiempo real
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifs:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => {
          const notif = payload.new as AppNotification;
          setNotifications(prev => [notif, ...prev].slice(0, 20));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id).catch(console.error);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => markNotificationRead(n.id))).catch(console.error);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead };
}
