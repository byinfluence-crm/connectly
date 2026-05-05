import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';

// Lazy — avoids module-level crash when env vars are absent at build time
let _admin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase env vars not configured');
    _admin = createClient(url, key);
  }
  return _admin;
}
const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    return getAdmin()[prop as keyof SupabaseClient];
  },
});

/**
 * Extrae y verifica el usuario desde el header Authorization: Bearer <token>.
 * El cliente envía el token con authFetch (src/lib/auth-fetch.ts).
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user ?? null;
}

/**
 * Exige que el usuario autenticado sea exactamente el usuario esperado.
 * Devuelve { authorized: true } o { authorized: false, response } listo para retornar.
 *
 * Uso en API routes:
 *   const auth = await requireOwnUser(req, user_id);
 *   if (!auth.authorized) return auth.response;
 */
export async function requireOwnUser(
  req: NextRequest,
  expectedUserId: string,
): Promise<{ authorized: true } | { authorized: false; response: Response }> {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    };
  }

  if (user.id !== expectedUserId) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      ),
    };
  }

  return { authorized: true };
}
