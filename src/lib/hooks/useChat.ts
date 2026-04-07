'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, getMessages, sendMessage } from '@/lib/supabase';
import type { Message } from '@/lib/supabase';

/**
 * Detecta números de teléfono en el texto.
 * Bloquea: móviles españoles, fijos, internacionales y cualquier
 * secuencia de 9+ dígitos consecutivos.
 */
export function containsPhone(text: string): boolean {
  const patterns = [
    // +34 6XX/7XX/8XX/9XX XXX XXX (con o sin espacios/guiones)
    /(\+34|0034)?[\s\-.]?[6-9]\d{2}[\s\-.]?\d{3}[\s\-.]?\d{3}/,
    // Cualquier secuencia de 9 o más dígitos (incluso con espacios entre pares)
    /\b\d[\d\s\-\.]{7,}\d\b/,
    // Formatos internacionales: +XX XXXXXXXXX
    /\+\d{1,3}[\s\-.]?\d{6,}/,
  ];
  return patterns.some(p => p.test(text));
}

export function useChat(applicationId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Cargar historial inicial
  useEffect(() => {
    if (!applicationId) return;
    setLoading(true);
    getMessages(applicationId)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [applicationId]);

  // Suscripción Realtime
  useEffect(() => {
    if (!applicationId) return;

    const channel = supabase
      .channel(`chat:${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          // Evitar duplicado si el INSERT fue propio (optimistic update)
          setMessages(prev =>
            prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
          );
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [applicationId]);

  const send = useCallback(async (content: string): Promise<{ blocked?: boolean }> => {
    if (!content.trim()) return {};

    // Bloquear si contiene teléfono
    if (containsPhone(content)) {
      return { blocked: true };
    }

    setSending(true);
    try {
      const msg = await sendMessage(applicationId, userId, content);
      // Optimistic: añadir de inmediato sin esperar al Realtime
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    } catch (err) {
      console.error('sendMessage error:', err);
    } finally {
      setSending(false);
    }
    return {};
  }, [applicationId, userId]);

  return { messages, loading, sending, send };
}
