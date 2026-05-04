'use client';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { ArrowRight, TrendingUp, Star, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const NICHES  = ['Gastronomía', 'Moda', 'Fitness', 'Viajes', 'Lifestyle', 'Tecnología', 'Belleza', 'Deporte', 'Gaming', 'Otro'];
const CITIES  = ['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Bilbao', 'Málaga', 'Zaragoza', 'Otra'];
const SECTORS = ['Gastronomía', 'Moda', 'Fitness', 'Viajes', 'Belleza', 'Tecnología', 'Hostelería', 'Retail', 'Salud', 'Otro'];

type Role = 'brand' | 'influencer';
type Step = 1 | 2 | 3;
type CreatorType = 'influencer' | 'ugc' | 'both';
type Platform = 'instagram' | 'tiktok' | 'both';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = params.get('role') as Role | null;

  const [role, setRole] = useState<Role>(defaultRole || 'influencer');
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    city: '', niche: '', sector: '',
    creatorType: '' as CreatorType | '',
    platforms: '' as Platform | '',
    instagramHandle: '',
    tiktokHandle: '',
    description: '', website: '',
  });

  const totalSteps = role === 'influencer' ? 3 : 2;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < totalSteps) setStep(s => (s + 1) as Step);
    else handleSubmit();
  };

  const needsInstagram = form.platforms === 'instagram' || form.platforms === 'both';
  const needsTiktok    = form.platforms === 'tiktok'    || form.platforms === 'both';

  const canAdvanceStep2 = role === 'influencer'
    ? !!form.creatorType && !!form.platforms
    : true;

  const canSubmit = termsAccepted && (
    role === 'influencer'
      ? (!needsInstagram || !!form.instagramHandle) && (!needsTiktok || !!form.tiktokHandle)
      : true
  );

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          display_name: form.name,
          user_type: role,
        },
      },
    });

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Ya existe una cuenta con ese email'
        : authError.message);
      setLoading(false);
      return;
    }

    // Si requiere confirmación de email
    if (!authData.session) {
      setEmailSent(true);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setError('Error al crear la cuenta. Inténtalo de nuevo.');
      setLoading(false);
      return;
    }

    // Crear marketplace_users
    await supabase.from('marketplace_users').upsert({
      id: userId,
      user_type: role,
      display_name: form.name,
      city: form.city || null,
      niche: role === 'influencer' ? (form.niche || null) : null,
      credits: 20,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      terms_version: '1.0',
    }, { onConflict: 'id' });

    if (role === 'influencer') {
      await supabase.from('influencer_profiles').upsert({
        user_id: userId,
        display_name: form.name,
        city: form.city || null,
        niches: form.niche ? [form.niche] : [],
        creator_type: form.creatorType || 'influencer',
        platforms: form.platforms === 'both'
          ? ['instagram', 'tiktok']
          : form.platforms ? [form.platforms] : [],
        instagram_handle: form.instagramHandle || null,
        tiktok_handle: form.tiktokHandle || null,
        followers_ig: 0,
        followers_tt: 0,
      }, { onConflict: 'user_id' });
    } else {
      await supabase.from('brand_profiles').upsert({
        user_id: userId,
        brand_name: form.name,
        sector: form.sector || null,
        city: form.city || null,
        description: form.description || null,
        website: form.website || null,
      }, { onConflict: 'user_id' });
    }

    router.push(role === 'influencer' ? '/dashboard/creator' : '/dashboard/brand');
    router.refresh();
  };

  // Pantalla de email enviado
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail size={28} className="text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Revisa tu email</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Te hemos enviado un enlace de confirmación a <strong>{form.email}</strong>.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <Link href="/login" className="text-violet-600 font-semibold text-sm hover:text-violet-700">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

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
              : 'Aplica a colaboraciones con las mejores marcas'}
          </h2>
          <div className="space-y-3">
            {(role === 'brand'
              ? ['Publica colaboraciones en minutos', 'Recibe solicitudes de creadores', 'Panel de gestión completo']
              : ['Registro gratuito', 'Aplica a colaboraciones reales', 'Gestiona tus entregas y pagos']
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
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Connectly</span>
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear cuenta</h1>
            <p className="text-gray-500 text-sm">20 créditos de regalo · Sin tarjeta de crédito</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            {(['brand', 'influencer'] as Role[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setStep(1); }}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${role === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {r === 'brand' ? '🏢 Soy marca' : '✨ Soy creador'}
              </button>
            ))}
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-6">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {s}
                </div>
                {s < totalSteps && <div className={`h-0.5 w-8 transition-colors ${step > s ? 'bg-violet-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
            <span className="text-xs text-gray-400 ml-2">
              {role === 'influencer'
                ? ['Datos básicos', 'Tipo de creador', 'Perfil y redes'][step - 1]
                : ['Datos básicos', 'Perfil de marca'][step - 1]
              }
            </span>
          </div>

          <form onSubmit={handleNext} className="space-y-4">

            {/* ── Step 1 (común) ── */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {role === 'brand' ? 'Nombre de la marca' : 'Tu nombre o alias'}
                  </label>
                  <input
                    type="text" required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={role === 'brand' ? 'ej. Restaurante Casa Nova' : 'ej. Laura García'}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email" required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="hola@ejemplo.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                  <input
                    type="password" required minLength={8}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  />
                </div>
                <Button type="submit" fullWidth size="lg">
                  Continuar <ArrowRight size={16} />
                </Button>
              </>
            )}

            {/* ── Step 2 influencer: tipo de creador + plataformas ── */}
            {step === 2 && role === 'influencer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Soy principalmente...</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'influencer', label: 'Influencer', desc: 'Contenido de marca con audiencia' },
                      { value: 'ugc',        label: 'UGC Creator', desc: 'Contenido para uso de la marca' },
                      { value: 'both',       label: 'Ambos',       desc: 'Influencer y UGC' },
                    ] as { value: CreatorType; label: string; desc: string }[]).map(opt => (
                      <button
                        key={opt.value} type="button"
                        onClick={() => setForm({ ...form, creatorType: opt.value })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${form.creatorType === opt.value ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-tight">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Mis plataformas</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'instagram', label: 'Instagram' },
                      { value: 'tiktok',    label: 'TikTok' },
                      { value: 'both',      label: 'Ambas' },
                    ] as { value: Platform; label: string }[]).map(opt => (
                      <button
                        key={opt.value} type="button"
                        onClick={() => setForm({ ...form, platforms: opt.value })}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${form.platforms === opt.value ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Atrás
                  </button>
                  <Button type="submit" fullWidth size="lg" disabled={!canAdvanceStep2}>
                    Continuar <ArrowRight size={16} />
                  </Button>
                </div>
              </>
            )}

            {/* ── Step 2 brand: perfil de marca ── */}
            {step === 2 && role === 'brand' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sector</label>
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map(s => (
                      <button
                        key={s} type="button"
                        onClick={() => setForm({ ...form, sector: s })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.sector === s ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 hover:border-violet-300'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
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
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox" checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 shrink-0"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    He leído y acepto los{' '}
                    <Link href="/terms" target="_blank" className="text-violet-600 underline">Términos</Link>{' '}
                    y la{' '}
                    <Link href="/privacy" target="_blank" className="text-violet-600 underline">Política de Privacidad</Link>.
                  </span>
                </label>
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Atrás
                  </button>
                  <Button type="submit" fullWidth size="lg" loading={loading} disabled={!canSubmit}>
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </Button>
                </div>
              </>
            )}

            {/* ── Step 3 influencer: handles + ciudad + nicho + términos ── */}
            {step === 3 && role === 'influencer' && (
              <>
                {needsInstagram && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuario de Instagram</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                      <input
                        required={needsInstagram}
                        value={form.instagramHandle}
                        onChange={e => setForm({ ...form, instagramHandle: e.target.value.replace('@', '') })}
                        placeholder="tuusuario"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                      />
                    </div>
                  </div>
                )}
                {needsTiktok && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuario de TikTok</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                      <input
                        required={needsTiktok}
                        value={form.tiktokHandle}
                        onChange={e => setForm({ ...form, tiktokHandle: e.target.value.replace('@', '') })}
                        placeholder="tuusuario"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                      />
                    </div>
                  </div>
                )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nicho principal</label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map(n => (
                      <button
                        key={n} type="button"
                        onClick={() => setForm({ ...form, niche: n })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.niche === n ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 hover:border-violet-300'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox" checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 shrink-0"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    He leído y acepto los{' '}
                    <Link href="/terms" target="_blank" className="text-violet-600 underline">Términos</Link>{' '}
                    y la{' '}
                    <Link href="/privacy" target="_blank" className="text-violet-600 underline">Política de Privacidad</Link>.
                  </span>
                </label>
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Atrás
                  </button>
                  <Button type="submit" fullWidth size="lg" loading={loading} disabled={!canSubmit}>
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </Button>
                </div>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-violet-600 font-semibold hover:text-violet-700">
              Inicia sesión
            </Link>
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
