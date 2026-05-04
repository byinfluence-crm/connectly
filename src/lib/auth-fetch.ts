import { supabase } from '@/lib/supabase';

/**
 * Wrapper de fetch que añade automáticamente el JWT del usuario actual
 * en el header Authorization: Bearer <token>.
 * Usar en lugar de fetch() para llamar a las API routes protegidas.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
