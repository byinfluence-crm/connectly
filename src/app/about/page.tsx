import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Sobre Connectly' };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-10">
          <ArrowLeft size={16} /> Volver
        </Link>

        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">Connectly</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">El marketplace de influencers más transparente de España</h1>
        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          Connectly nace para simplificar la relación entre marcas e influencers: sin intermediarios, sin pagos en el aire y con datos reales de cada colaboración.
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">¿Qué hacemos?</h2>
            <p className="text-gray-600 leading-relaxed">
              Somos la plataforma donde marcas publican sus campañas y creadores de contenido aplican directamente. Todo el proceso — contacto, acuerdo, entrega de resultados y valoraciones — ocurre dentro de Connectly, protegido por nuestro sistema de escrow y reseñas verificadas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Nuestra misión</h2>
            <p className="text-gray-600 leading-relaxed">
              Hacer que cada euro invertido en marketing de influencers sea medible, justo y seguro — tanto para la marca que invierte como para el creador que trabaja.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">¿Quiénes somos?</h2>
            <p className="text-gray-600 leading-relaxed">
              Connectly es parte de Byinfluence, agencia especializada en marketing de influencers con base en España. Llevamos años gestionando colaboraciones entre marcas y creadores, y hemos construido Connectly para democratizar ese acceso.
            </p>
          </section>

          <section className="bg-violet-50 rounded-2xl p-6">
            <h2 className="text-base font-bold text-gray-900 mb-2">¿Quieres saber más?</h2>
            <p className="text-sm text-gray-600 mb-4">Escríbenos o crea tu cuenta — es gratis.</p>
            <div className="flex gap-3">
              <Link href="/register">
                <button className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors">
                  Empezar gratis
                </button>
              </Link>
              <Link href="/contact">
                <button className="px-5 py-2.5 rounded-xl border border-violet-200 text-violet-700 text-sm font-semibold hover:bg-violet-100 transition-colors">
                  Contactar
                </button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
