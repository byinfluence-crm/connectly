'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Introduce tu email'); return; }
    setLoading(true);
    setError('');

    // Siempre enviar el link al dominio de producción, nunca a localhost.
    // Si NEXT_PUBLIC_APP_URL está definida se usa esa, si no cae al origin actual.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${appUrl}/reset-password`,
    });

    setLoading(false);
    if (err) { setError('No se pudo enviar el email. Comprueba la dirección.'); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft size={16} /> Volver al login
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-2">Email enviado</h1>
              <p className="text-sm text-gray-500 mb-6">
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Revisa también tu carpeta de spam.
              </p>
              <Link href="/login">
                <button className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors">
                  Volver al login
                </button>
              </Link>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-4">
                <Mail size={22} className="text-violet-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Recuperar contraseña</h1>
              <p className="text-sm text-gray-500 mb-6">
                Introduce tu email y te enviamos un enlace para restablecer tu contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
