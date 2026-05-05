'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { supabase, getMarketplaceUser } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : error.message);
      setLoading(false);
      return;
    }

    // Redirigir según user_type
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        const profile = await getMarketplaceUser(userId);
        if (profile.user_type === 'superadmin') router.push('/dashboard/admin');
        else if (profile.user_type === 'influencer') router.push('/dashboard/creator');
        else router.push('/dashboard/brand');
        router.refresh();
        return;
      }
    } catch {
      // Si falla la consulta, ir al dashboard genérico que redirecciona
    }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-gradient-to-br from-violet-700 to-violet-900 p-10 flex-col justify-between">
        <Link href="/">
          <img src="/logo-horizontal.svg" alt="Connectly" className="h-8 w-auto brightness-0 invert" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Bienvenido de nuevo</h2>
          <p className="text-violet-300 text-sm leading-relaxed">
            Tus colaboraciones te esperan. Entra y sigue construyendo conexiones que funcionan.
          </p>
        </div>
        <p className="text-violet-400 text-xs">© 2026 Connectly · by Byinfluence</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex mb-8 lg:hidden">
            <img src="/logo-horizontal.svg" alt="Connectly" className="h-8 w-auto" />
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Iniciar sesión</h1>
            <p className="text-gray-500 text-sm">Accede a tu cuenta de Connectly</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="hola@ejemplo.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all bg-white"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                <Link href="/forgot" className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Tu contraseña"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all bg-white"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-violet-600 font-semibold hover:text-violet-700">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
