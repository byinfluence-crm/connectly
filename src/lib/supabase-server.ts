import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';

// Admin client con service role — verifica tokens JWT sin depender de cookies
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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
