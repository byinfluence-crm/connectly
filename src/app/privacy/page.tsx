import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Política de privacidad — Connectly' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-10">
          <ArrowLeft size={16} /> Volver
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Política de privacidad</h1>
        <p className="text-xs text-gray-400 mb-10">Última actualización: abril 2026</p>

        <div className="prose prose-sm max-w-none text-gray-600 space-y-8">
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">1. Responsable del tratamiento</h2>
            <p>Byinfluence S.L. (en adelante, <strong>Connectly</strong>), con domicilio en España y email de contacto <a href="mailto:hola@connectly.es" className="text-violet-600">hola@connectly.es</a>, es el responsable del tratamiento de los datos personales recogidos a través de connectly.es.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">2. Datos que recogemos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Datos de registro: nombre, email, tipo de cuenta (marca o creador), ciudad, nicho.</li>
              <li>Datos de actividad: colaboraciones publicadas o solicitadas, mensajes de chat, entregas de resultados, valoraciones.</li>
              <li>Datos técnicos: dirección IP, tipo de navegador, cookies de sesión necesarias para el funcionamiento del servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">3. Finalidad del tratamiento</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Gestionar tu cuenta y el acceso a la plataforma.</li>
              <li>Facilitar la conexión entre marcas e influencers.</li>
              <li>Mostrar estadísticas y análisis de rendimiento de campañas.</li>
              <li>Enviarte comunicaciones transaccionales (notificaciones de candidaturas, reseñas, pagos).</li>
              <li>Mejorar el servicio mediante datos agregados y anónimos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">4. Base legal</h2>
            <p>El tratamiento se basa en la ejecución del contrato (Términos de uso) que aceptas al registrarte, así como en el interés legítimo de Connectly para mejorar su servicio.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">5. Conservación de datos</h2>
            <p>Conservamos tus datos mientras tu cuenta esté activa. Puedes solicitar la eliminación en cualquier momento escribiendo a <a href="mailto:hola@connectly.es" className="text-violet-600">hola@connectly.es</a>. Los datos necesarios para cumplir obligaciones legales o resolver disputas se conservarán el tiempo mínimo exigido por la ley.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">6. Terceros</h2>
            <p>Utilizamos proveedores de confianza: <strong>Supabase</strong> (base de datos y autenticación, servidores en EU), <strong>Vercel</strong> (hosting, servidores en EU), <strong>Stripe</strong> (pagos). Ninguno vende tus datos a terceros.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">7. Tus derechos</h2>
            <p>Tienes derecho de acceso, rectificación, supresión, portabilidad y oposición. Ejércelos escribiendo a <a href="mailto:hola@connectly.es" className="text-violet-600">hola@connectly.es</a>. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
          </section>
        </div>
      </div>
    </div>
  );
}
