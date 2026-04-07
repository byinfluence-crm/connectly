'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase envía el token en el hash (#access_token=...) o como query param
  // onAuthStateChange lo recoge automáticamente cuando hay un evento PASSWORD_RECOVERY
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true);
    });
    // También check si ya hay sesión activa (token ya procesado)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }

    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) { setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.'); return; }
    setDone(true);
    setTimeout(() => router.replace('/login'), 3000);
  };

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-emerald-500" />
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-2">Contraseña actualizada</h2>
        <p className="text-sm text-gray-500">Redirigiendo al login...</p>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="text-center py-6">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Verificando enlace de recuperación...</p>
        <p className="text-xs text-gray-400 mt-2">
          Si el enlace ha expirado, <Link href="/forgot" className="text-violet-600 underline">solicita uno nuevo</Link>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-1 block">Nueva contraseña</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10"
          />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-700 mb-1 block">Confirmar contraseña</label>
        <input
          type={show ? 'text' : 'password'}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Repite la contraseña"
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Indicador de fuerza */}
      {password && (
        <div className="flex gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
              i < (password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1)
                ? 'bg-violet-500' : 'bg-gray-100'
            }`} />
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Actualizando...' : 'Establecer nueva contraseña'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-4">
            <Lock size={22} className="text-violet-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Nueva contraseña</h1>
          <p className="text-sm text-gray-500 mb-6">Elige una contraseña segura para tu cuenta.</p>
          <Suspense fallback={<div className="h-8 bg-gray-50 rounded animate-pulse" />}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
