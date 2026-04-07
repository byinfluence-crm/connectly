import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Mismos posts que en /blog/page.tsx — en producción esto vendría de un CMS
const POSTS: Record<string, {
  category: string; categoryColor: string;
  title: string; excerpt: string;
  author: string; date: string; readTime: string;
  img: string;
  body: string;
  stats: { label: string; value: string }[];
}> = {
  'restaurante-elena-reel-viral': {
    category: 'Caso de éxito', categoryColor: 'bg-violet-100 text-violet-700',
    title: 'Cómo un restaurante de Madrid consiguió 280K visualizaciones con un solo reel',
    excerpt: 'Elena García, propietaria de Taberna del Sur, publicó una colaboración de canje en Connectly un martes por la tarde. El viernes siguiente tenía lista de espera para el fin de semana.',
    author: 'Equipo Connectly', date: 'marzo 2026', readTime: '4 min',
    img: 'https://picsum.photos/seed/blog-featured/800/420',
    stats: [{ label: 'Visualizaciones', value: '280K' }, { label: 'Reservas nuevas', value: '+63' }, { label: 'ROI estimado', value: '×9' }],
    body: `Elena García lleva ocho años al frente de Taberna del Sur, en el barrio de Lavapiés. Como muchos restauradores, había probado Instagram Ads, Google y hasta reparto en buzoneo. Los resultados, mediocres.

**El briefing que publicó en Connectly era sencillo:** cena para dos a cambio de un reel mostrando el ambiente y el menú degustación. Sin guión impuesto, sin fecha de publicación obligatoria.

En menos de 48 horas recibió 14 solicitudes. Eligió a @madrideats, una creadora con 22.000 seguidores muy activa en gastronomía madrileña.

**Lo que nadie esperaba:** el reel fue recomendado por el algoritmo de Instagram durante cinco días consecutivos. 280.000 visualizaciones, 4.200 guardados y 63 reservas directamente atribuidas a personas que mencionaron el vídeo al llamar.

> "Llevo años haciendo marketing y nunca había visto un retorno así de rápido y de claro. El canje me costó 40€ en comida y generó reservas por valor de más de 3.500€ en ese fin de semana."
> — Elena García, Taberna del Sur

**Qué hizo bien Elena:**
- Dejó libertad creativa total a la influencer
- Eligió a alguien con audiencia local y comprometida, no a la cuenta más grande
- El plato fotografiado era visualmente impactante (tartar de atún con trufa)
- Publicó en jueves, el mejor día para decisiones de fin de semana

Desde entonces, Taberna del Sur ha activado tres campañas más en Connectly. La última, con cinco creadoras simultáneas para el menú de temporada de primavera.`,
  },
  'marca-cosmetica-10-influencers': {
    category: 'Caso de éxito', categoryColor: 'bg-violet-100 text-violet-700',
    title: '10 micro-influencers, 1 lanzamiento de producto y 48h de stock agotado',
    excerpt: 'Lumina Beauty coordinó 10 campañas simultáneas con creadoras de belleza de entre 8K y 40K seguidores.',
    author: 'Equipo Connectly', date: 'feb 2026', readTime: '5 min',
    img: 'https://picsum.photos/seed/blog-cosmetica/800/420',
    stats: [{ label: 'Alcance total', value: '312K' }, { label: 'Unidades vendidas', value: '840' }, { label: 'Horas en agotar stock', value: '48h' }],
    body: `Lumina Beauty llevaba seis meses desarrollando su nuevo sérum vitamina C. El presupuesto de marketing era de 2.000€ para el lanzamiento — insuficiente para una campaña con macro-influencers.

**La estrategia:** en lugar de una sola campaña grande, publicaron diez colaboraciones en Connectly simultáneamente, con un briefing idéntico pero dejando libertad de formato. Pago de 150€ por creadora más el producto.

Las diez creadoras tenían entre 8.000 y 40.000 seguidores. Audiencias pequeñas pero muy cualificadas en belleza y skincare. Engagement rates entre el 7% y el 12%.

**El resultado a las 48 horas del primer post:** 840 unidades vendidas, stock agotado. Lista de espera de 300 personas para la siguiente producción.

La clave no fue el alcance bruto (312.000 personas en total) sino la **confianza de cada audiencia en su creadora favorita**. Cuando diez personas de confianza recomiendan algo el mismo día, el efecto es exponencialmente mayor que un solo post masivo.`,
  },
  'gym-local-barcelona': {
    category: 'Caso de éxito', categoryColor: 'bg-violet-100 text-violet-700',
    title: 'Un gimnasio local en Barcelona dobló sus altas en enero con 3 colaboraciones de canje',
    excerpt: 'Sin presupuesto en efectivo, FitSpace Barcelona ofreció mensualidades a tres creadoras de fitness.',
    author: 'Equipo Connectly', date: 'ene 2026', readTime: '3 min',
    img: 'https://picsum.photos/seed/blog-gym/800/420',
    stats: [{ label: 'Nuevas altas', value: '89' }, { label: 'Coste por alta', value: '0€' }, { label: 'Meses de campañas', value: '3' }],
    body: `Enero es el mes de los gimnasios, pero la competencia es brutal. FitSpace Barcelona decidió apostar por tres creadoras locales de fitness a cambio de membresía gratuita durante tres meses.

Sin coste en efectivo. Sin agencia. Sin complicaciones.

Las tres creadoras publicaron durante todo enero mostrando sus entrenamientos, el ambiente del gym y sus progresos. Contenido auténtico, no producido.

**89 nuevas altas directamente atribuidas.** A un coste de adquisición de 0€ en cash (solo tres mensualidades cedidas, valoradas en 150€ en total).

El director de FitSpace calcula que la misma inversión en Meta Ads habría generado entre 8 y 12 altas en el mejor de los casos.`,
  },
  'guia-micro-influencers-2026': {
    category: 'Guía', categoryColor: 'bg-blue-100 text-blue-700',
    title: 'Por qué los micro-influencers generan mejor ROI que los macro en 2026',
    excerpt: 'Los datos de más de 400 campañas en Connectly revelan una verdad incómoda para las grandes agencias.',
    author: 'Equipo Connectly', date: 'ene 2026', readTime: '6 min',
    img: 'https://picsum.photos/seed/blog-micro/800/420',
    stats: [{ label: 'ER medio micro', value: '8.4%' }, { label: 'ER medio macro', value: '2.1%' }, { label: 'Diferencia', value: '×4' }],
    body: `Hemos analizado más de 400 campañas cerradas en Connectly durante 2025. Los datos son contundentes: el engagement rate medio de los creadores con entre 10.000 y 50.000 seguidores es del 8,4%. El de los que superan los 500.000 seguidores: 2,1%.

**¿Por qué ocurre esto?**

Los micro-influencers mantienen una relación más cercana con su comunidad. Responden comentarios, hacen directos espontáneos, conocen a parte de sus seguidores en persona. Cuando recomiendan algo, su audiencia lo percibe como un consejo de un amigo, no como publicidad.

**Implicaciones para las marcas:**

1. Con el mismo presupuesto, puedes activar 5-10 micro-influencers en lugar de 1 macro
2. La segmentación es más precisa (nicho + ciudad + perfil demográfico)
3. El contenido es más auténtico y reutilizable
4. El riesgo reputacional es menor (ninguna cuenta concentra todo)

**La excepción:** los macro-influencers siguen siendo útiles para campañas de notoriedad pura donde el objetivo es volumen de impresiones, no conversión directa.

Para la mayoría de marcas medianas y pequeñas, la estrategia óptima en 2026 es **muchos micro, pocos macro**.`,
  },
  'tienda-moda-sevilla': {
    category: 'Caso de éxito', categoryColor: 'bg-violet-100 text-violet-700',
    title: 'De tienda local a marca conocida en Andalucía: el caso de Atelier Sevilla',
    excerpt: 'Durante seis meses, Atelier Sevilla activó campañas mensuales con creadoras de moda.',
    author: 'Equipo Connectly', date: 'dic 2025', readTime: '4 min',
    img: 'https://picsum.photos/seed/blog-moda/800/420',
    stats: [{ label: 'Crecimiento IG', value: '+340%' }, { label: 'Ventas online vs físicas', value: '51% online' }, { label: 'Campañas activadas', value: '6' }],
    body: `Atelier Sevilla era una tienda de ropa con mucho estilo y poca visibilidad fuera de su barrio. Seis meses después de su primera campaña en Connectly, envían pedidos a toda Andalucía.

**La estrategia mensual:** una campaña por mes, siempre con creadoras de moda de diferentes ciudades andaluzas. Sevilla, Málaga, Córdoba, Granada. Cada campaña llegaba a una audiencia nueva pero con el mismo perfil de cliente ideal.

El crecimiento en Instagram fue de un 340% en seis meses. Pero más relevante: las ventas online (que antes eran residuales) superaron por primera vez a las ventas en tienda física.

**La lección:** la consistencia importa más que la viralidad. Ninguna de las seis campañas fue viral. Pero seis campañas bien ejecutadas, mes a mes, construyen reconocimiento de marca de forma sostenible.`,
  },
  'negociar-canje-producto': {
    category: 'Consejos', categoryColor: 'bg-emerald-100 text-emerald-700',
    title: 'Cómo negociar un canje de producto que sea justo para ambas partes',
    excerpt: 'El canje es la forma de colaboración más extendida, pero también la que más malentendidos genera.',
    author: 'Equipo Connectly', date: 'nov 2025', readTime: '5 min',
    img: 'https://picsum.photos/seed/blog-canje/800/420',
    stats: [{ label: 'Campañas de canje en Connectly', value: '68%' }, { label: 'Satisfacción media', value: '4.7★' }, { label: 'Conflictos evitables', value: '9/10' }],
    body: `El 68% de las campañas en Connectly son canjes de producto. Y el 90% de los conflictos que vemos son evitables si se aclaran cuatro cosas desde el principio.

**1. Define el valor del canje con honestidad**

El creador calcula si el canje merece su tiempo en función del valor real del producto (precio de venta al público, no precio de coste). Si el canje vale 30€ y esperas tres posts, el creador lo sabe perfectamente.

**2. Especifica el formato y la cantidad de contenido**

"Un post" puede significar muy distintas cosas. Sé específico: un reel de mínimo 30 segundos en feed + dos stories con encuesta. Cuanto más claro, menos malentendidos.

**3. Define el plazo de publicación**

Sin fecha, el contenido puede publicarse cuando el creador quiera — o no publicarse. Incluye siempre una ventana de publicación: "entre el 15 y el 22 de noviembre".

**4. Deja libertad creativa real**

El contenido impuesto rinde peor. Comparte referencias de estilo, no un guión. Los mejores resultados llegan cuando el creador puede mostrar el producto de forma auténtica dentro de su estética habitual.

**5. Usa el sistema de valoraciones**

Connectly publica las reseñas de ambas partes una vez completada la colaboración. Esto protege a marcas y creadores por igual, y crea un historial de reputación que hace que futuras colaboraciones sean más fáciles de negociar.`,
  },
  'hotel-boutique-valencia': {
    category: 'Caso de éxito', categoryColor: 'bg-violet-100 text-violet-700',
    title: 'El hotel boutique de Valencia que llenó su temporada baja con travel creators',
    excerpt: 'Casa Levante tenía un problema clásico: noviembre y febrero siempre con baja ocupación.',
    author: 'Equipo Connectly', date: 'oct 2025', readTime: '4 min',
    img: 'https://picsum.photos/seed/blog-hotel/800/420',
    stats: [{ label: 'Ocupación nov-feb', value: '+58%' }, { label: 'Noches de canje ofrecidas', value: '12' }, { label: 'Reservas generadas', value: '89 noches' }],
    body: `Casa Levante es un hotel boutique de 14 habitaciones en el centro histórico de Valencia. Lleno en verano y en Fallas, vacío en temporada baja.

La solución fue activar tres campañas en Connectly durante octubre, noviembre y enero, ofreciendo estancias de dos noches a travel creators y food bloggers con audiencias de viajeros.

**El cálculo es sencillo:** doce noches cedidas (coste real: unos 600€ en servicios) generaron 89 noches de reservas directas en los meses siguientes — personas que vieron el contenido y reservaron mencionando a la creadora.

Además, el contenido generado (fotos, vídeos, reseñas) sigue siendo útil mucho después de la campaña. Casa Levante ahora tiene un banco de contenido profesional que usa en sus propios canales.

**La clave del éxito:** eligieron creadoras con audiencias de viajeros reales, no de aspiracionales. Personas que efectivamente viajan y que siguen a cuentas de viaje porque buscan destinos donde ir.`,
  },
};

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900 mb-2">404</p>
          <p className="text-gray-500 mb-6">Este artículo no existe.</p>
          <Link href="/blog">
            <button className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors">
              Ver todos los artículos
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const bodyParagraphs = post.body.split('\n\n');

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/blog" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={16} /> Blog
          </Link>
          <div className="flex-1" />
          <Link href="/register">
            <button className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors">
              Empezar gratis
            </button>
          </Link>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 py-10">
        {/* Meta */}
        <div className="mb-6">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${post.categoryColor}`}>{post.category}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-snug">{post.title}</h1>
        <p className="text-gray-500 text-base leading-relaxed mb-6">{post.excerpt}</p>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-8 pb-6 border-b border-gray-100">
          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs">C</div>
          <span>{post.author}</span>
          <span>·</span>
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readTime} lectura</span>
        </div>

        {/* Cover */}
        <img src={post.img} alt={post.title} className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-8" />

        {/* Stats highlight */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {post.stats.map(s => (
            <div key={s.label} className="bg-violet-50 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-violet-700 mb-1">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="space-y-5 text-gray-700 leading-relaxed text-[15px]">
          {bodyParagraphs.map((p, i) => {
            if (p.startsWith('**') && p.endsWith('**') && !p.includes('\n')) {
              return <p key={i} className="font-bold text-gray-900">{p.replace(/\*\*/g, '')}</p>;
            }
            if (p.startsWith('> ')) {
              return (
                <blockquote key={i} className="border-l-4 border-violet-400 pl-4 italic text-gray-600 bg-violet-50 py-3 pr-4 rounded-r-xl">
                  {p.replace(/^> /, '').replace(/\n> — /, '\n— ')}
                </blockquote>
              );
            }
            // Bold inline
            const rendered = p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />;
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-violet-600 to-violet-800 rounded-3xl p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-2">¿Listo para tu primera campaña?</h2>
          <p className="text-violet-200 text-sm mb-6">Publica gratis y recibe candidaturas de creadores verificados en menos de 24h.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/register?role=brand">
              <button className="px-6 py-3 rounded-xl bg-white text-violet-700 text-sm font-bold hover:bg-violet-50 transition-colors">
                Empezar como marca
              </button>
            </Link>
            <Link href="/blog">
              <button className="px-6 py-3 rounded-xl border border-violet-400 text-white text-sm font-semibold hover:bg-violet-700 transition-colors flex items-center gap-1.5">
                Más casos <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
