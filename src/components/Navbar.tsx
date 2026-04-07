'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Zap, LogOut, ChevronDown } from 'lucide-react';
import Button from './ui/Button';
import { useAuth } from './AuthProvider';
import { supabase, getUserCredits } from '@/lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  // Cargar créditos cuando hay sesión
  useEffect(() => {
    if (!user) { setCredits(null); return; }
    getUserCredits(user.id).then(setCredits).catch(() => setCredits(null));
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
    setMenuOpen(false);
  };

  const displayName = user?.user_metadata?.display_name as string | undefined;
  const initials = displayName
    ? displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Connectly</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/discover" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Descubrir
          </Link>
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Planes
          </Link>
          <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Cómo funciona
          </Link>
        </nav>

        {/* Desktop: auth state */}
        <div className="hidden md:flex items-center gap-2">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* Badge créditos */}
              {credits !== null && (
                <div className="flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-full border border-violet-100">
                  <Zap size={12} className="fill-violet-600" />
                  {credits} créditos
                </div>
              )}

              {/* Avatar + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-20">
                      <div className="px-4 py-2.5 border-b border-gray-50">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {displayName ?? user.email}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{user.email}</div>
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        Mi perfil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} /> Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Únete gratis</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          <Link href="/discover" className="text-sm text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-50" onClick={() => setOpen(false)}>
            Descubrir
          </Link>
          <Link href="/pricing" className="text-sm text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-50" onClick={() => setOpen(false)}>
            Planes
          </Link>
          <Link href="/about" className="text-sm text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-50" onClick={() => setOpen(false)}>
            Cómo funciona
          </Link>

          {user ? (
            <div className="pt-2 pb-1 flex flex-col gap-2 border-t border-gray-100 mt-1">
              {credits !== null && (
                <div className="flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-3 py-2 rounded-xl border border-violet-100 w-fit">
                  <Zap size={12} className="fill-violet-600" /> {credits} créditos
                </div>
              )}
              <div className="text-sm font-semibold text-gray-900 px-1">{displayName ?? user.email}</div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-red-600 px-1 py-1"
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="pt-2 pb-1 flex flex-col gap-2">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" fullWidth>Entrar</Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button fullWidth>Únete gratis</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
