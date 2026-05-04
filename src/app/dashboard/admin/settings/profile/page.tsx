'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminProfilePage() {
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [agencyName, setAgencyName]   = useState('');
  const [email, setEmail]             = useState('');

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? '');
    fetch('/api/admin/profile')
      .then(r => r.json())
      .then(d => {
        setDisplayName(d.display_name ?? '');
        setAgencyName(d.agency_name ?? '');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, agency_name: agencyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (!error) setResetSent(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil de agencia</h1>
        <p className="text-sm text-gray-500 mt-0.5">Información que aparece en el panel</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Datos de la agencia</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre de la agencia
            </label>
            <input
              required
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              placeholder="ej. Byinfluence"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tu nombre (aparece en el sidebar)
            </label>
            <input
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="ej. Diego"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email de acceso
            </label>
            <input
              disabled
              value={email}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar desde aquí</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 w-full justify-center bg-violet-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : null}
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </form>

      {/* Cambio de contraseña */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Contraseña</h2>
        <p className="text-sm text-gray-500 mb-4">
          Te enviaremos un email para cambiar tu contraseña
        </p>
        {resetSent ? (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <CheckCircle2 size={16} />
            Email enviado a {email}. Revisa tu bandeja.
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePasswordReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <KeyRound size={15} />
            Enviar email de cambio de contraseña
          </button>
        )}
      </div>
    </div>
  );
}
