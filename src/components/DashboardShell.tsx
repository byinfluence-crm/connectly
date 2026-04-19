'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Search, FileText, Users, BarChart3,
  Video, User, LogOut, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase, getMarketplaceUser } from '@/lib/supabase';

type NavItem = { label: string; href: string; icon: React.ElementType; badge?: number };

const BRAND_NAV: NavItem[] = [
  { label: 'Inicio', href: '/dashboard/brand', icon: LayoutDashboard },
  { label: 'Descubrir', href: '/discover', icon: Search },
  { label: 'Colaboraciones', href: '/dashboard/brand/collabs', icon: FileText },
  { label: 'Candidatos', href: '/dashboard/brand/candidates', icon: Users },
  { label: 'Proyectos UGC', href: '/dashboard/brand/ugc', icon: Video },
  { label: 'Analytics', href: '/dashboard/brand/analytics', icon: BarChart3 },
];

const creatorNav = (userId: string): NavItem[] => [
  { label: 'Inicio', href: '/dashboard/creator', icon: LayoutDashboard },
  { label: 'Buscar', href: '/discover', icon: Search },
  { label: 'Mis aplicaciones', href: '/dashboard/creator/applications', icon: FileText },
  { label: 'Analytics', href: '/dashboard/creator/analytics', icon: BarChart3 },
  { label: 'Mi perfil', href: `/creators/${userId}`, icon: User },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [userType, setUserType] = useState<'brand' | 'influencer' | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }

    setDisplayName(user.user_metadata?.display_name || '');

    getMarketplaceUser(user.id)
      .then(profile => setUserType(profile.user_type as 'brand' | 'influencer'))
      .catch(() => {
        // Fallback: infer from URL
        if (pathname.includes('/creator')) setUserType('influencer');
        else if (pathname.includes('/brand')) setUserType('brand');
        else router.replace('/login');
      });
  }, [user, loading, router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Loading state
  if (loading || !userType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = userType === 'influencer'
    ? creatorNav(user?.id || '')
    : BRAND_NAV;

  const roleLabel = userType === 'influencer' ? 'Creador' : 'Marca';
  const fallbackName = userType === 'influencer' ? 'Creador' : 'Mi Marca';

  const isActive = (href: string) => {
    if (href === '/discover') return pathname === '/discover';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">Connectly</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} className={active ? 'text-violet-600' : 'text-gray-400'} />
              {item.label}
              {item.badge ? (
                <span className="ml-auto bg-violet-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-gray-100 p-4 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-bold text-xs">
            {(displayName || fallbackName).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {displayName || fallbackName}
            </p>
            <p className="text-xs text-gray-400">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen fixed top-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-30 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg hover:bg-gray-100"
        >
          <Menu size={22} className="text-gray-700" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-gray-900">Connectly</span>
        </Link>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-end p-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
