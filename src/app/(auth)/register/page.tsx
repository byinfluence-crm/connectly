'use client';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { ArrowRight, TrendingUp, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const NICHES = ['Gastronomía', 'Moda', 'Fitness', 'Viajes', 'Lifestyle', 'Tecnología', 'Belleza', 'Deporte', 'Gaming', 'Otro'];
const CITIES = ['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Bilbao', 'Málaga', 'Zaragoza', 'Otra'];

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = params.get('role') as 'brand' | 'influencer' | null;

  const [role, setRole] = useState<'brand' | 'influencer'>(defaultRole || 'brand');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', niche: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Paso 1 → paso 2
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError('');

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { display_name: form.name, user_type: role },
      },
    });

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Ya existe una cuenta con ese email'
        : authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setError('Error al crear la cuenta. Inténtalo de nuevo.');
      setLoading(false);
      return;
    }

    // 2. Crear perfil en marketplace_users (20 créditos de bienvenida)
    const { error: profileError } = await supabase.from('marketplace_users').insert({
      id: userId,
      user_type: role,
      display_name: form.name,
      city: form.city || null,
      niche: form.niche || null,
      credits: 20,
    });

    if (profileError) {
      // Si ya existe (trigger en Supabase lo creó antes), no es error crítico
      if (!profileError.message.includes('duplicate')) {
        console.error('Profile insert error:', profileError.message);
      }
    }

    router.push('/discover');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-gradient-to-br from-violet-700 to-violet-900 p-10 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-white text-lg">Connectly</span>
        </Link>
        <div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
            {role === 'brand'
              ? <TrendingUp size={26} className="text-white" />
              : <Star size={26} className="text-amber-300" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-4 leading-snug">
            {role === 'brand'
              ? 'Encuentra al creador perfecto para tu marca'
              : 'Recibe propuestas de marcas que encajan contigo'}
          </h2>
          <p className="text-violet-300 text-sm leading-relaxed mb-8">
            {role === 'brand'
              ? 'Publica en minutos y recibe solicitudes de creadores verificados.'
              : 'Tu perfil, tu precio, tus reglas. Sin intermediarios.'}
          </p>
          <div className="space-y-3">
            {(role === 'brand'
              ? ['Sin comisiones por colaboración', '1 mes gratis para empezar', 'Acceso a 2.400+ creadores']
              : ['Perfil gratuito para siempre', 'Propuestas directas de marcas', '1 mes de plan Starter gratis']
            ).map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-violet-200">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-violet-400 text-xs">© 2026 Connectly · by Byinfluence</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Connectly</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear cuenta</h1>
            <p className="text-gray-500 text-sm">1 mes gratis · Sin tarjeta de crédito · 20 créditos de regalo</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            {(['brand', 'influencer'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${role === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {r === 'brand' ? '🏢 Soy marca' : '✨ Soy creador'}
              </button>
            ))}
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {s}
                </div>
                {s < 2 && <div className={`h-0.5 w-8 transition-colors ${step > s ? 'bg-violet-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
            <span className="text-xs text-gray-400 ml-2">{step === 1 ? 'Datos básicos' : 'Tu perfil'}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {role === 'brand' ? 'Nombre de la marca' : 'Tu nombre o alias'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={role === 'brand' ? 'ej. Restaurante Casa Nova' : 'ej. Laura García'}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all bg-white"
                  />
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all bg-white"
                  />
                </div>
                <Button type="submit" fullWidth size="lg">
                  Continuar <ArrowRight size={16} />
                </Button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
                  <select
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  >
                    <option value="">Selecciona ciudad</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {role === 'brand' ? 'Sector' : 'Nicho principal'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm({ ...form, niche: n })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.niche === n ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 hover:border-violet-300'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button type="submit" fullWidth size="lg" loading={loading}>
                  {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
                </Button>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-violet-600 font-semibold hover:text-violet-700">
              Inicia sesión
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-gray-400">
            Al registrarte aceptas los{' '}
            <Link href="/terms" className="underline hover:text-gray-600">Términos de uso</Link>
            {' '}y la{' '}
            <Link href="/privacy" className="underline hover:text-gray-600">Política de privacidad</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
