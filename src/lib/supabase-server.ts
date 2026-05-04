import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';

/**
 * Verifica la sesión del usuario desde las cookies del request.
 * Usar en API routes para autenticar quién está llamando.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<User | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // Las API routes no necesitan refrescar cookies
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user;
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
