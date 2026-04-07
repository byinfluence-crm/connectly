'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', role: 'brand', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simple mailto fallback — en producción conectar con Resend
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft size={16} /> Volver
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Contacto</h1>
        <p className="text-sm text-gray-500 mb-8">Estamos aquí para ayudarte. Respondemos en menos de 24h.</p>

        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          <a href="mailto:hola@connectly.es" className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:border-violet-200 transition-colors">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-violet-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Email</div>
              <div className="text-xs text-violet-600">hola@connectly.es</div>
            </div>
          </a>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-600 text-sm font-bold">IG</span>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Instagram</div>
              <div className="text-xs text-violet-600">@connectly.es</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-2">¡Mensaje enviado!</h2>
              <p className="text-sm text-gray-500">Te respondemos en menos de 24h en el email que has indicado.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Nombre</label>
                  <input
                    required value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Email</label>
                  <input
                    type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Soy...</label>
                <div className="flex gap-2">
                  {[{ v: 'brand', l: 'Marca / empresa' }, { v: 'creator', l: 'Creador de contenido' }, { v: 'other', l: 'Otro' }].map(o => (
                    <button
                      type="button" key={o.v}
                      onClick={() => set('role', o.v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        form.role === o.v ? 'bg-violet-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Mensaje</label>
                <textarea
                  required value={form.message} onChange={e => set('message', e.target.value)}
                  placeholder="Cuéntanos en qué podemos ayudarte..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
