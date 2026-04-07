import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Términos de uso — Connectly' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-10">
          <ArrowLeft size={16} /> Volver
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Términos de uso</h1>
        <p className="text-xs text-gray-400 mb-10">Última actualización: abril 2026</p>

        <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">1. Aceptación</h2>
            <p>Al registrarte en Connectly aceptas estos Términos de uso. Si no estás de acuerdo, no utilices la plataforma.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">2. Descripción del servicio</h2>
            <p>Connectly es un marketplace que conecta marcas y creadores de contenido para llevar a cabo colaboraciones de marketing. La plataforma facilita el contacto, la gestión del proceso y la publicación de resultados y valoraciones.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">3. Cuentas de usuario</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Debes tener al menos 18 años para registrarte.</li>
              <li>Eres responsable de mantener la seguridad de tu cuenta.</li>
              <li>No puedes crear cuentas falsas ni suplantar a terceros.</li>
              <li>Una cuenta por persona o empresa.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">4. Uso aceptable</h2>
            <p>Queda prohibido: compartir datos de contacto en el chat de la plataforma, realizar pagos fuera del sistema de escrow de Connectly, publicar contenido falso o engañoso, hacer spam o acosar a otros usuarios.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">5. Pagos y comisiones</h2>
            <p>Connectly cobra una comisión sobre los pagos procesados a través de la plataforma. La comisión exacta se muestra en el momento de la transacción. Los pagos quedan en custodia (escrow) hasta que ambas partes confirman la finalización de la colaboración.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">6. Reseñas</h2>
            <p>Las valoraciones deben ser honestas y basadas en la experiencia real. Connectly puede retirar reseñas que incumplan estas normas. Las reseñas son públicas y no pueden eliminarse una vez publicadas (salvo decisión de Connectly por incumplimiento).</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">7. Propiedad intelectual</h2>
            <p>El contenido generado por los creadores en el marco de una colaboración es propiedad de sus autores, salvo acuerdo expreso con la marca. Connectly no reclama derechos sobre dicho contenido.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">8. Limitación de responsabilidad</h2>
            <p>Connectly es un intermediario y no es parte en los acuerdos entre marcas e influencers. No nos hacemos responsables de incumplimientos entre partes ni de acuerdos realizados fuera de la plataforma.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">9. Modificaciones</h2>
            <p>Podemos modificar estos Términos en cualquier momento. Te avisaremos por email con al menos 15 días de antelación ante cambios sustanciales.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">10. Contacto</h2>
            <p>Para cualquier consulta: <a href="mailto:hola@connectly.es" className="text-violet-600">hola@connectly.es</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
