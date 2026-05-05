'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, getDirectMessages, sendDirectMessage, markDirectMessagesRead } from '@/lib/supabase';
import type { DirectMessage } from '@/lib/supabase';
import { containsBlockedContent } from './useChat';

export function useChatDirect(conversationId: string, userId: string) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Cargar historial inicial
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    setLoading(true);

    getDirectMessages(conversationId)
      .then(msgs => {
        if (!cancelled) setMessages(msgs);
        if (!cancelled && userId) markDirectMessagesRead(conversationId, userId).catch(() => {});
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [conversationId]);

  // Suscripción Realtime
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`direct:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `direct_conversation_id=eq.${conversationId}`,
        },
        payload => {
          const msg = payload.new as DirectMessage;
          setMessages(prev =>
            prev.some(m => m.id === msg.id) ? prev : [...prev, msg],
          );
          // Si el mensaje es del otro, marcarlo como leído inmediatamente
          if (msg.sender_user_id !== userId) {
            markDirectMessagesRead(conversationId, userId).catch(() => {});
          }
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  const send = useCallback(async (content: string): Promise<{ blocked?: boolean }> => {
    if (!content.trim()) return {};
    if (containsBlockedContent(content)) return { blocked: true };

    setSending(true);
    try {
      const msg = await sendDirectMessage(conversationId, userId, content);
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    } catch (err) {
      console.error('sendDirectMessage error:', err);
    } finally {
      setSending(false);
    }
    return {};
  }, [conversationId, userId]);

  return { messages, loading, sending, send };
}
