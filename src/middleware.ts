import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// El middleware solo pasa todas las peticiones sin bloquear.
// La autenticación se gestiona client-side en DashboardShell y en cada página.
// Nota: @supabase/ssr requiere que el cliente del navegador también use
// createBrowserClient para compartir cookies — hasta entonces el guard
// de middleware causaba bucles de redirección.
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
