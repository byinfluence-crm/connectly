'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Button from './ui/Button';

export default function Navbar() {
  const [open, setOpen] = useState(false);

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

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Únete gratis</Button>
          </Link>
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
          <div className="pt-2 pb-1 flex flex-col gap-2">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" fullWidth>Entrar</Button>
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}>
              <Button fullWidth>Únete gratis</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
