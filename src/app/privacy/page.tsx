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

        <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">1. Responsable del tratamiento</h2>
            <p>Byinfluence S.L. (en adelante, <strong>Connectly</strong>), con domicilio en Sevilla (España) y email de contacto <a href="mailto:hola@connectly-influence.es" className="text-violet-600">hola@connectly-influence.es</a>, es el responsable del tratamiento de los datos personales recogidos a través de connectly-influence.es.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">2. Datos que recogemos</h2>
            <p>Recogemos las siguientes categorías de datos personales:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Datos de registro:</strong> nombre o nombre comercial, dirección de email, contraseña (cifrada), tipo de cuenta (marca o creador), ciudad y nicho/sector.</li>
              <li><strong>Datos de actividad:</strong> colaboraciones publicadas o solicitadas, mensajes de chat, entregas de resultados, valoraciones, historial de créditos y desbloqueos de perfiles.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, cookies de sesión necesarias para el funcionamiento del servicio.</li>
              <li><strong>Datos de pago:</strong> cuando se activen los pagos, los datos de tarjeta serán procesados directamente por Stripe. Connectly no almacena números de tarjeta.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">3. Finalidad del tratamiento</h2>
            <p>Utilizamos tus datos para las siguientes finalidades:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Gestionar tu cuenta y el acceso a la plataforma.</li>
              <li>Facilitar la conexión y comunicación entre marcas y creadores.</li>
              <li>Procesar pagos y comisiones a través del servicio.</li>
              <li>Mostrar estadísticas y análisis de rendimiento de colaboraciones.</li>
              <li>Enviarte comunicaciones transaccionales (notificaciones de candidaturas, reseñas, estado de colaboraciones).</li>
              <li>Mejorar el servicio mediante datos agregados y anónimos.</li>
              <li>Prevenir fraude y uso indebido de la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">4. Base legal del tratamiento</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Ejecución del contrato:</strong> el tratamiento es necesario para prestar el servicio conforme a los Términos y Condiciones que aceptas al registrarte (Art. 6.1.b RGPD).</li>
              <li><strong>Interés legítimo:</strong> para mejorar el servicio, prevenir fraude y garantizar la seguridad de la plataforma (Art. 6.1.f RGPD).</li>
              <li><strong>Consentimiento:</strong> para comunicaciones comerciales no transaccionales, si las hubiera (Art. 6.1.a RGPD).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">5. Conservación de datos</h2>
            <p>Conservamos tus datos personales durante los siguientes plazos:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Datos de cuenta:</strong> mientras tu cuenta esté activa. Puedes solicitar la eliminación en cualquier momento.</li>
              <li><strong>Datos de colaboraciones y reseñas:</strong> 3 años desde la finalización de la colaboración, o el plazo necesario para cumplir obligaciones legales.</li>
              <li><strong>Datos de facturación:</strong> 5 años conforme a la legislación fiscal española.</li>
              <li><strong>Datos técnicos (logs):</strong> 12 meses máximo.</li>
            </ul>
            <p className="mt-2">Tras la eliminación de tu cuenta, los datos se anonimizarán o eliminarán en un plazo máximo de 30 días, salvo obligación legal de conservación.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">6. Destinatarios y terceros</h2>
            <p>Compartimos datos con los siguientes proveedores de confianza, todos ellos con servidores en la Unión Europea o con garantías adecuadas:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Supabase:</strong> base de datos y autenticación (servidores en EU).</li>
              <li><strong>Vercel:</strong> hosting y despliegue de la aplicación (servidores en EU).</li>
              <li><strong>Stripe:</strong> procesamiento de pagos (cumple PCI DSS).</li>
            </ul>
            <p className="mt-2">No vendemos, alquilamos ni compartimos tus datos personales con terceros con fines comerciales.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">7. Transferencias internacionales</h2>
            <p>Todos nuestros proveedores principales operan dentro de la Unión Europea. En caso de que algún subprocesador estuviera fuera del EEE, nos aseguraremos de que existan garantías adecuadas conforme al RGPD (cláusulas contractuales tipo, decisiones de adecuación, etc.).</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">8. Tus derechos</h2>
            <p>Conforme al Reglamento General de Protección de Datos (RGPD), tienes derecho a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Acceso:</strong> solicitar una copia de los datos personales que tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado y de uso común.</li>
              <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
              <li><strong>Limitación:</strong> solicitar la restricción del tratamiento de tus datos.</li>
            </ul>
            <p className="mt-2">Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:hola@connectly-influence.es" className="text-violet-600">hola@connectly-influence.es</a>. Responderemos en un plazo máximo de 30 días.</p>
            <p className="mt-2">También puedes presentar una reclamación ante la <strong>Agencia Española de Protección de Datos</strong> (aepd.es) si consideras que tus derechos no han sido atendidos correctamente.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">9. Cookies</h2>
            <p>Connectly utiliza únicamente cookies técnicas de sesión necesarias para el funcionamiento del servicio (autenticación y preferencias). No utilizamos cookies de seguimiento ni publicitarias. Al ser cookies estrictamente necesarias, no requieren consentimiento previo conforme al RGPD.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">10. Modificaciones</h2>
            <p>Podemos actualizar esta Política de privacidad para reflejar cambios en nuestras prácticas o en la legislación aplicable. Te notificaremos cambios sustanciales por email. La fecha de última actualización se indica al inicio de este documento.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">11. Contacto</h2>
            <p>Para cualquier consulta sobre privacidad o protección de datos: <a href="mailto:hola@connectly-influence.es" className="text-violet-600">hola@connectly-influence.es</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
