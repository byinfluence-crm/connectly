import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/dashboard', '/chat'];
const AUTH_ONLY  = ['/login', '/register', '/forgot'];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() verifica el JWT contra Supabase (no confía solo en la cookie local)
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = req.nextUrl.pathname;

  // Sin sesión intentando acceder a ruta protegida → login
  if (!user && PROTECTED.some(p => pathname.startsWith(p))) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Ya autenticado intentando ir a login/register → dashboard
  if (user && AUTH_ONLY.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chat/:path*',
    '/login',
    '/register',
    '/forgot',
  ],
};
