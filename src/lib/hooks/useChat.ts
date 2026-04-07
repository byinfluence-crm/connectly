'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, getMessages, sendMessage } from '@/lib/supabase';
import type { Message } from '@/lib/supabase';

// ─── Detección de contenido bloqueado ────────────────────────────────────────

/** Números de teléfono directos */
function hasPhoneNumber(t: string): boolean {
  return [
    // Español con o sin prefijo: +34 / 0034 / directo 6XX-7XX-8XX-9XX
    /(\+34|0034)?[\s\-.]?[6-9]\d{2}[\s\-.]?\d{3}[\s\-.]?\d{3}/,
    // 9+ dígitos en secuencia, con separadores opcionales
    /\b\d[\d\s\-./]{7,}\d\b/,
    // Internacional: +XX seguido de 6+ dígitos
    /\+\d{1,3}[\s\-.]?\d{6,}/,
  ].some(p => p.test(t));
}

/** Emails: patron@dominio.tld */
function hasEmail(t: string): boolean {
  return /\b[\w.+\-]+@[\w\-]+\.[\w.]{2,}\b/.test(t);
}

/**
 * Números escritos con palabras (≥4 palabras-número consecutivas).
 * "seis uno dos tres" → bloqueado. "los dos somos uno" → no bloqueado.
 */
const NUMBER_WORDS = new Set([
  // Español
  'cero','uno','una','dos','tres','cuatro','cinco','seis','siete','ocho','nueve',
  // Inglés
  'zero','one','two','three','four','five','six','seven','eight','nine',
]);

function hasNumberWords(t: string): boolean {
  const words = t.toLowerCase().split(/[\s,;.:]+/);
  let streak = 0;
  for (const w of words) {
    streak = NUMBER_WORDS.has(w) ? streak + 1 : 0;
    if (streak >= 4) return true;
  }
  return false;
}

/**
 * Dígitos mezclados con letras para disimular un teléfono: "6l2-3a5-678".
 * Solo normaliza tokens que YA contienen al menos un dígito,
 * evitando falsos positivos en palabras normales.
 */
function hasObfuscatedPhone(t: string): boolean {
  const normalized = t.replace(/\S+/g, token => {
    if (!/\d/.test(token)) return token; // solo tocar tokens con dígitos
    return token
      .replace(/[lI|]/g, '1')
      .replace(/[oO]/g,  '0')
      .replace(/[eE]/g,  '3')
      .replace(/[sS]/g,  '5')
      .replace(/[gGq]/g, '9')
      .replace(/[bB]/g,  '8')
      .replace(/[zZ]/g,  '7');
  });
  return hasPhoneNumber(normalized);
}

/** WhatsApp mencionado explícitamente */
function hasWhatsAppRef(t: string): boolean {
  return /\b(whats+\s*app|what[sz]\s*up|wasa+p?|wasap|wapp|wpp|w\.a\.)\b/i.test(t);
}

/**
 * Handle de red social: @username.
 * Requiere letra inicial para evitar "@100%" o "@3pm".
 */
function hasSocialHandle(t: string): boolean {
  return /@[a-zA-Z][a-zA-Z0-9_.]{1,29}\b/.test(t);
}

/**
 * Función principal de detección.
 * Exportable para tests y para uso en la UI (warning en tiempo real).
 */
export function containsBlockedContent(text: string): boolean {
  return (
    hasPhoneNumber(text)     ||
    hasEmail(text)           ||
    hasNumberWords(text)     ||
    hasObfuscatedPhone(text) ||
    hasWhatsAppRef(text)     ||
    hasSocialHandle(text)
  );
}

/** Alias de compatibilidad con código anterior */
export const containsPhone = containsBlockedContent;

// ─── Hook de chat ─────────────────────────────────────────────────────────────

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
        payload => {
          const msg = payload.new as Message;
          setMessages(prev =>
            prev.some(m => m.id === msg.id) ? prev : [...prev, msg],
          );
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [applicationId]);

  const send = useCallback(async (content: string): Promise<{ blocked?: boolean }> => {
    if (!content.trim()) return {};
    if (containsBlockedContent(content)) return { blocked: true };

    setSending(true);
    try {
      const msg = await sendMessage(applicationId, userId, content);
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
