import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Términos y Condiciones — Connectly' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-10">
          <ArrowLeft size={16} /> Volver
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
        <p className="text-xs text-gray-400 mb-10">Última actualización: abril 2026 · Versión 1.0</p>

        <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">1. Aceptación de los términos</h2>
            <p>Al registrarte y utilizar Connectly aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna de sus cláusulas, no utilices la plataforma. El uso continuado del servicio tras cualquier modificación implica la aceptación de los términos actualizados.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">2. Descripción del servicio</h2>
            <p>Connectly es una plataforma digital operada por Byinfluence S.L. que facilita la conexión entre marcas y creadores de contenido para llevar a cabo colaboraciones de marketing. La plataforma proporciona herramientas de gestión, comunicación, seguimiento de entregas y valoraciones.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">3. Naturaleza de intermediario</h2>
            <p>Connectly actúa exclusivamente como plataforma intermediaria. No es parte en los acuerdos, contratos o negociaciones que se establezcan entre marcas y creadores a través de la plataforma. Las condiciones específicas de cada colaboración (plazos, contenido, compensación) se acuerdan directamente entre las partes.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">4. Cuentas de usuario</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Debes tener al menos 18 años para registrarte.</li>
              <li>Eres responsable de mantener la seguridad de tu cuenta y contraseña.</li>
              <li>No puedes crear cuentas falsas ni suplantar a terceros.</li>
              <li>Una cuenta por persona o empresa.</li>
              <li>Connectly se reserva el derecho de suspender o cancelar cuentas que incumplan estos términos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">5. Responsabilidad del contenido</h2>
            <p>El usuario es el único responsable del contenido que publica, comparte o transmite a través de la plataforma, incluyendo pero no limitado a: textos, imágenes, vídeos, enlaces, datos de perfil y mensajes. Connectly no revisa previamente el contenido publicado, pero se reserva el derecho de eliminar contenido que incumpla estos términos o la legislación vigente.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">6. Uso aceptable</h2>
            <p>Queda prohibido:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Compartir datos de contacto en el chat para eludir la plataforma.</li>
              <li>Realizar pagos fuera del sistema de Connectly para colaboraciones gestionadas en la plataforma.</li>
              <li>Publicar contenido falso, engañoso, difamatorio u ofensivo.</li>
              <li>Hacer spam o acosar a otros usuarios.</li>
              <li>Utilizar la plataforma para actividades ilegales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">7. Pagos y comisiones</h2>
            <p>Connectly cobra una comisión sobre los pagos procesados a través de la plataforma. La comisión exacta se muestra en el momento de la transacción. Los pagos quedan en custodia hasta que ambas partes confirman la finalización de la colaboración.</p>
            <p className="mt-2 font-medium text-gray-700">La comisión de Connectly es irretornable una vez que el proyecto ha sido iniciado por ambas partes.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">8. Ausencia de garantía de resultados</h2>
            <p>Connectly no garantiza resultados específicos derivados de las colaboraciones entre marcas y creadores. El rendimiento, alcance, engagement u otros indicadores de las campañas dependen de factores ajenos al control de la plataforma. Las métricas y estadísticas proporcionadas son orientativas.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">9. Reseñas y valoraciones</h2>
            <p>Las valoraciones deben ser honestas y basadas en la experiencia real de la colaboración. Connectly puede retirar reseñas que incumplan estas normas. Las reseñas son públicas y no pueden eliminarse una vez publicadas, salvo decisión de Connectly por incumplimiento de los términos.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">10. Propiedad intelectual</h2>
            <p>El contenido generado por los creadores en el marco de una colaboración es propiedad de sus autores, salvo acuerdo expreso con la marca. Connectly no reclama derechos sobre dicho contenido. La marca Connectly, su logotipo y diseño son propiedad de Byinfluence S.L.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">11. Limitación de responsabilidad</h2>
            <p>Connectly, en su condición de intermediario:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>No se hace responsable de los acuerdos, contenidos, resultados o daños derivados de las colaboraciones entre marcas y creadores.</li>
              <li>No garantiza la disponibilidad ininterrumpida del servicio.</li>
              <li>No será responsable de daños directos, indirectos, incidentales, especiales, consecuentes o de lucro cesante derivados del uso o imposibilidad de uso de la plataforma.</li>
              <li>No se responsabiliza de la veracidad de la información proporcionada por los usuarios.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">12. Resolución de disputas</h2>
            <p>Las disputas surgidas entre marca y creador en el contexto de una colaboración se resolverán directamente entre las partes involucradas. Connectly podrá facilitar la comunicación pero no actúa como mediador ni árbitro. En caso de incumplimiento grave por una de las partes, Connectly se reserva el derecho de suspender cuentas.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">13. Modificaciones de los términos</h2>
            <p>Podemos modificar estos Términos en cualquier momento. Te avisaremos por email con al menos 15 días de antelación ante cambios sustanciales. El uso continuado de la plataforma tras la notificación implica la aceptación de los nuevos términos.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">14. Ley aplicable y jurisdicción</h2>
            <p>Estos Términos y Condiciones se rigen por la legislación española. Para cualquier controversia derivada de estos términos o del uso de la plataforma, las partes se someten a los juzgados y tribunales de Sevilla (España), con renuncia expresa a cualquier otro fuero que pudiera corresponderles.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">15. Contacto</h2>
            <p>Para cualquier consulta sobre estos términos: <a href="mailto:hola@connectly-influence.es" className="text-violet-600 hover:text-violet-700">hola@connectly-influence.es</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
