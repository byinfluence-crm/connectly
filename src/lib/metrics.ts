/**
 * metrics.ts — port of byinfluence_metrics.py
 * Pure math, no external deps, same results as the CRM.
 */

// ══════════════════════════════════════════════════════════════════════════════
// 1. HELPERS
// ══════════════════════════════════════════════════════════════════════════════

export function fmtN(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function calcularTier(seguidores: number): 'mega' | 'macro' | 'mid' | 'micro' | 'nano' {
  if (seguidores >= 1_000_000) return 'mega';
  if (seguidores >= 100_000)   return 'macro';
  if (seguidores >= 10_000)    return 'mid';
  if (seguidores >= 1_000)     return 'micro';
  return 'nano';
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. MÉTRICAS DE RENDIMIENTO
// ══════════════════════════════════════════════════════════════════════════════

export function calcularEr(
  likes: number,
  comentarios: number,
  seguidores: number,
  plataforma: 'ig' | 'tt' = 'ig',
  views = 0,
): number {
  if (plataforma === 'ig') {
    if (seguidores <= 0) return 0;
    return Math.round((likes + comentarios) / seguidores * 100 * 100) / 100;
  }
  const base = views > 0 ? views : seguidores;
  if (base <= 0) return 0;
  return Math.round((likes + comentarios) / base * 100 * 100) / 100;
}

export function calcularCpm(coste: number, views: number): number | null {
  if (views <= 0) return null;
  return Math.round(coste / (views / 1000) * 100) / 100;
}

export function calcularCpi(coste: number, interacciones: number): number | null {
  if (interacciones <= 0) return null;
  return Math.round(coste / interacciones * 100) / 100;
}

export function calcularReachEstimado(
  seguidores: number,
  plataforma: 'ig' | 'tt' = 'ig',
  views = 0,
): number {
  if (plataforma === 'ig') return views > 0 ? views : Math.round(seguidores * 0.2);
  return views > 0 ? Math.round(views * 0.7) : 0;
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. PRECIO RECOMENDADO
// ══════════════════════════════════════════════════════════════════════════════

export interface PrecioRecomendado {
  precio: number;
  is_historico: boolean;
  colabs: number;
  precio_stories?: number;
  precio_post?: number;
}

export function calcularPrecioRecomendado(
  plataforma: 'ig' | 'tt',
  avg_views: number,
  seguidores: number,
  er = 0,
  quality_score = 0,
  cpm_historico = 0,
  colabs_count = 0,
): PrecioRecomendado {
  let min_p: number, max_p: number;
  if (seguidores > 200_000)      { min_p = 200; max_p = 1500; }
  else if (seguidores > 50_000)  { min_p = 100; max_p = 600; }
  else if (seguidores > 10_000)  { min_p = 50;  max_p = 300; }
  else                            { min_p = 25;  max_p = 150; }

  const redondear = (p: number) =>
    Math.max(min_p, Math.min(max_p, Math.round(p / 25) * 25));

  let precio: number;
  let is_hist: boolean;

  if (cpm_historico > 0) {
    precio = redondear(avg_views * cpm_historico / 1000 * 1.1);
    is_hist = true;
  } else {
    const cpm_base = plataforma === 'ig' ? 3.0 : 2.0;
    let p = avg_views * cpm_base / 1000;
    if (er > 5)       p *= 1.30;
    else if (er > 3)  p *= 1.10;
    else if (er < 1)  p *= 0.90;
    if (quality_score > 0) {
      if (quality_score < 40)       p *= 0.70;
      else if (quality_score < 60)  p *= 0.85;
      else if (quality_score > 80)  p *= 1.10;
    }
    precio = redondear(p);
    is_hist = false;
  }

  const result: PrecioRecomendado = { precio, is_historico: is_hist, colabs: colabs_count };
  if (plataforma === 'ig') {
    result.precio_stories = Math.max(25, Math.round(precio * 0.4 / 25) * 25);
    result.precio_post    = Math.round(precio * 1.2 / 25) * 25;
  }
  return result;
}

export interface VeredictoResult {
  etiqueta: string;
  clase: 'ok' | 'warn' | 'bad' | 'neutro';
  diferencia_pct: number | null;
}

export function veredictioPrecio(
  precio_pedido: number,
  precio_recomendado: number,
): VeredictoResult {
  if (precio_pedido <= 0 || precio_recomendado <= 0)
    return { etiqueta: 'Sin datos', clase: 'neutro', diferencia_pct: null };
  const ratio = precio_pedido / precio_recomendado;
  if (ratio <= 0.90) return { etiqueta: 'Precio favorable', clase: 'ok',   diferencia_pct: Math.round((1 - ratio) * 100) };
  if (ratio <= 1.15) return { etiqueta: 'Precio justo',     clase: 'ok',   diferencia_pct: 0 };
  if (ratio <= 1.40) return { etiqueta: 'Ligeramente caro', clase: 'warn', diferencia_pct: Math.round((ratio - 1) * 100) };
  return               { etiqueta: 'Fuera de rango',    clase: 'bad',  diferencia_pct: Math.round((ratio - 1) * 100) };
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. QUALITY SCORE (0–100)
// ══════════════════════════════════════════════════════════════════════════════

export interface QualityScoreResult {
  score: number;
  etiqueta: string;
  clase: 'green' | 'orange' | 'red';
  er_score: number;
  ratio_score: number;
  iqr_score: number;
  er_target: number;
  iqr_pct: number | null;
  tier: string;
}

export function calcularQualityScore(
  seguidores: number,
  er: number,
  likes = 0,
  comentarios = 0,
  views_arr: number[] | null = null,
  plataforma: 'ig' | 'tt' = 'ig',
): QualityScoreResult {
  const tier = calcularTier(Math.round(seguidores));
  const er_target_map: Record<string, number> = { nano: 5, micro: 3, mid: 1.5, macro: 0.8, mega: 0.5 };
  const er_target = er_target_map[tier] ?? 3;

  // ER score (0–40)
  let er_score = 0;
  if (er > 0 && er_target > 0) {
    const ratio = er / er_target;
    if (ratio >= 1)          er_score = 40;
    else if (ratio >= 0.5)   er_score = Math.round((ratio - 0.5) * 2 * 40);
  }

  // Likes/comentarios ratio (0–30)
  let ratio_score = 0;
  if (likes > 0 && comentarios > 0) {
    const lc = likes / comentarios;
    if (lc < 50)        ratio_score = 30;
    else if (lc <= 100) ratio_score = 20;
    else if (lc <= 300) ratio_score = 10;
  }

  // Consistencia IQR (0–30)
  let iqr_score = 0;
  let iqr_pct: number | null = null;
  if (views_arr && views_arr.length >= 4) {
    const arr = [...views_arr].sort((a, b) => a - b);
    const q1 = arr[Math.floor(arr.length / 4)];
    const q3 = arr[Math.floor(arr.length * 3 / 4)];
    const iqr = q3 - q1;
    const lo = q1 - 1.5 * iqr;
    const hi = q3 + 1.5 * iqr;
    const inliers = arr.filter(v => v >= lo && v <= hi);
    iqr_pct = inliers.length / arr.length * 100;
    if (iqr_pct >= 80)      iqr_score = 30;
    else if (iqr_pct >= 60) iqr_score = 15;
  }

  const score = er_score + ratio_score + iqr_score;
  let etiqueta: string, clase: 'green' | 'orange' | 'red';
  if (score >= 75)       { etiqueta = 'Audiencia de calidad'; clase = 'green'; }
  else if (score >= 50)  { etiqueta = 'Sospechoso';           clase = 'orange'; }
  else                   { etiqueta = 'Evitar colaborar';     clase = 'red'; }

  return { score, etiqueta, clase, er_score, ratio_score, iqr_score, er_target, iqr_pct, tier };
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. PREDICTION ENGINE v2
// ══════════════════════════════════════════════════════════════════════════════

const MULT_TENDENCIA: [number, number][] = [
  [40,        1.20],
  [15,        1.10],
  [-15,       1.00],
  [-40,       0.88],
  [-Infinity, 0.75],
];

const MULT_AUTENTICIDAD: [number, number][] = [
  [90,        1.05],
  [75,        1.00],
  [50,        0.88],
  [-Infinity, 0.70],
];

const MULT_PATROCINADO = 0.82;

function percentil(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (s.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

function mediana(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function multTabla(tabla: [number, number][], valor: number | null | undefined): number {
  if (valor == null) return 1.0;
  for (const [umbral, mult] of tabla) {
    if (valor >= umbral) return mult;
  }
  return 1.0;
}

function tendenciaPct(views_arr: number[]): number {
  if (views_arr.length < 4) return 0;
  const mitad = Math.floor(views_arr.length / 2);
  const reciente = views_arr.slice(0, mitad).reduce((a, b) => a + b, 0) / mitad;
  const antiguo  = views_arr.slice(-mitad).reduce((a, b) => a + b, 0) / mitad;
  if (antiguo <= 0) return 0;
  return Math.round((reciente - antiguo) / antiguo * 1000) / 10;
}

export interface PrediccionPerfil {
  pesimista: number;
  probable: number;
  optimista: number;
  potencial_viral: number;
  prob_viral: number;
  mult_tendencia: number;
  mult_autenticidad: number;
  mult_patrocinado: number;
  mult_total: number;
  tendencia_pct: number;
  confianza_score: number;
  cv_views: number;
  intervalo_pesimista: number;
  intervalo_optimista: number;
  views_usados: number;
  benchmark_sample_size: number;
  algo_version: string;
  warning: string | null;
}

export class PredictionEngine {
  static readonly ALGO_VERSION = 'v2.0';

  predecir(opts: {
    media_views: number;
    seguidores: number;
    views_ultimos_12?: number[] | null;
    tendencia_pct?: number | null;
    autenticidad_score?: number | null;
    es_patrocinado?: boolean;
    quality_score?: number;
    num_campanas?: number;
    plataforma?: 'ig' | 'tt';
    benchmark_views?: number[] | null;
  }): PrediccionPerfil | null {
    const {
      media_views, seguidores,
      views_ultimos_12 = null,
      tendencia_pct: tendencia_ext = null,
      autenticidad_score = null,
      es_patrocinado = true,
      quality_score = 0,
      num_campanas = 0,
      plataforma = 'ig',
      benchmark_views = null,
    } = opts;

    const views = (views_ultimos_12 ?? []).filter(v => v && v > 0);

    let pesimista = 0, probable = 0, optimista = 0;
    let pot_viral = 0, prob_viral = 0;
    let tendencia = tendencia_ext ?? 0;
    let confianza = 0;
    let warning: string | null = null;
    let benchmark_n = 0;
    let views_usados = 0;

    if (views.length >= 3) {
      views_usados = views.length;
      const med = mediana(views);
      const umbral_viral = med * 5;
      const normales = views.filter(v => v <= umbral_viral).length > 0
        ? views.filter(v => v <= umbral_viral)
        : views;
      const virales = views.filter(v => v > umbral_viral);

      const p20 = percentil(normales, 20);
      const p50 = percentil(normales, 50);
      const p70 = percentil(normales, 70);

      if (tendencia_ext == null) {
        tendencia = tendenciaPct(normales.length >= 4 ? normales : views);
      }

      prob_viral = Math.round(virales.length / views.length * 100);
      pot_viral  = virales.length > 0 ? Math.max(...virales) : 0;

      if (views.length >= 12)     confianza += 30;
      else if (views.length >= 8) confianza += 20;
      else                        confianza += 10;

      if (benchmark_views) {
        const bench_vals = benchmark_views.filter(v => v > 0);
        const bench_med  = mediana(bench_vals);
        benchmark_n = bench_vals.length;
        if (benchmark_n >= 3 && bench_med > 0) {
          confianza += 30;
          pesimista = Math.round(p20 * 0.7 + bench_med * 0.5 * 0.3);
          probable  = Math.round(p50 * 0.7 + bench_med       * 0.3);
          optimista = Math.round(p70 * 0.7 + bench_med * 1.3 * 0.3);
        } else {
          pesimista = Math.round(p20); probable = Math.round(p50); optimista = Math.round(p70);
        }
      } else {
        pesimista = Math.round(p20); probable = Math.round(p50); optimista = Math.round(p70);
      }

    } else if (media_views > 0) {
      pesimista = Math.round(media_views * 0.50);
      probable  = Math.round(media_views * 0.82);
      optimista = Math.round(media_views * 1.15);
      warning   = 'Estimación sin reels individuales — analiza el perfil para mayor precisión';
    } else {
      return null;
    }

    if (quality_score > 60)  confianza += 20;
    if (num_campanas > 0)    confianza += 20;
    confianza = Math.min(100, confianza);

    if (pesimista > 0 && media_views > 0 && pesimista < media_views * 0.1) {
      warning = (warning ?? '') + 'Predicción pesimista inusualmente baja';
    }

    const mult_tend = multTabla(MULT_TENDENCIA, tendencia);
    const mult_aut  = multTabla(MULT_AUTENTICIDAD, autenticidad_score);
    const mult_pat  = es_patrocinado ? MULT_PATROCINADO : 1.0;
    const mult_tot  = Math.round(mult_tend * mult_aut * mult_pat * 1000) / 1000;

    pesimista = Math.round(pesimista * mult_tot);
    probable  = Math.round(probable  * mult_tot);
    optimista = Math.round(optimista * mult_tot);

    let cv = 0;
    if (views.length >= 3) {
      const mn = views.reduce((a, b) => a + b, 0) / views.length;
      if (mn > 0) {
        const variance = views.reduce((a, v) => a + (v - mn) ** 2, 0) / views.length;
        cv = Math.round(Math.sqrt(variance) / mn * 100) / 100;
      }
    }

    const cv_factor = plataforma === 'tt' ? 1.6 : 1.35;
    const cv_adj = Math.max(1, cv);
    const int_pes = Math.round(probable * (1 - 0.40 * Math.min(cv_adj, 2) * cv_factor / 2));
    const int_opt = Math.round(probable * (1 + 0.50 * Math.min(cv_adj, 2) * cv_factor / 2));

    return {
      pesimista, probable, optimista,
      potencial_viral: pot_viral, prob_viral,
      mult_tendencia: mult_tend, mult_autenticidad: mult_aut,
      mult_patrocinado: mult_pat, mult_total: mult_tot,
      tendencia_pct: tendencia, confianza_score: confianza,
      cv_views: cv,
      intervalo_pesimista: int_pes, intervalo_optimista: int_opt,
      views_usados, benchmark_sample_size: benchmark_n,
      algo_version: PredictionEngine.ALGO_VERSION, warning,
    };
  }

  precisionError(predicho: number, real: number): number | null {
    if (predicho <= 0) return null;
    return Math.round((real - predicho) / predicho * 100 * 10) / 10;
  }

  errorMedioHistorico(snapshots: { precision_error_pct?: number | null }[]): {
    error_medio_abs: number | null;
    sesgo: number | null;
    n: number;
  } {
    const errs = snapshots
      .filter(s => s.precision_error_pct != null)
      .map(s => Number(s.precision_error_pct));
    if (!errs.length) return { error_medio_abs: null, sesgo: null, n: 0 };
    const abs_errs = errs.map(Math.abs);
    return {
      error_medio_abs: Math.round(abs_errs.reduce((a, b) => a + b, 0) / abs_errs.length * 10) / 10,
      sesgo:           Math.round(errs.reduce((a, b) => a + b, 0) / errs.length * 10) / 10,
      n: errs.length,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. SCORE DE CAMPAÑA (0–100)
// ══════════════════════════════════════════════════════════════════════════════

export interface InfluencerRegistrado {
  colaboracion_registrada?: string;
  views_reales_ig?: number | string | null;
  views_reales_tt?: number | string | null;
  views_reales?: number | string | null;
  coste_acordado?: number | string | null;
  fecha_publicacion_acordada?: string | null;
  fecha_publicacion_real?: string | null;
}

export function calcularScoreCampana(
  influencers_registrados: InfluencerRegistrado[],
  objetivo_views = 0,
  presupuesto_total = 0,
): {
  score: number | null;
  total_views: number;
  total_coste: number;
  cpm_real: number | null;
  detalle: Record<string, number>;
} {
  const infs = influencers_registrados.filter(i => i.colaboracion_registrada === 'si');
  if (!infs.length) return { score: null, total_views: 0, total_coste: 0, cpm_real: null, detalle: {} };

  const total_views = infs.reduce((sum, i) =>
    sum + Number(i.views_reales_ig ?? 0) + Number(i.views_reales_tt ?? 0) + Number(i.views_reales ?? 0), 0);
  if (!total_views) return { score: null, total_views: 0, total_coste: 0, cpm_real: null, detalle: {} };

  const total_coste = infs.reduce((sum, i) => sum + Number(i.coste_acordado ?? 0), 0);
  let score = 0;

  // Objetivo (0–40)
  const obj_score = objetivo_views > 0
    ? Math.min(40, Math.round(total_views / objetivo_views * 40))
    : 20;
  score += obj_score;

  // CPM eficiencia (0–30)
  let cpm_real: number | null = null;
  let cpm_score = 0;
  if (total_coste > 0) {
    cpm_real = Math.round(total_coste / (total_views / 1000) * 100) / 100;
    if (cpm_real < 3)       cpm_score = 30;
    else if (cpm_real < 6)  cpm_score = 22;
    else if (cpm_real < 10) cpm_score = 14;
    else if (cpm_real < 20) cpm_score = 7;
  } else {
    cpm_score = 15;
  }
  score += cpm_score;

  // Puntualidad (0–20)
  const con_fechas = infs.filter(i => i.fecha_publicacion_acordada && i.fecha_publicacion_real);
  let puntualidad_score = 0;
  if (con_fechas.length) {
    const en_plazo = con_fechas.filter(i => i.fecha_publicacion_real! <= i.fecha_publicacion_acordada!).length;
    puntualidad_score = Math.round(en_plazo / con_fechas.length * 20);
  } else {
    puntualidad_score = 10;
  }
  score += puntualidad_score;

  // Presupuesto (0–10)
  let presupuesto_score = 0;
  if (presupuesto_total > 0) {
    if (total_coste <= presupuesto_total)        presupuesto_score = 10;
    else if (total_coste <= presupuesto_total * 1.1) presupuesto_score = 5;
  } else {
    presupuesto_score = 5;
  }
  score += presupuesto_score;
  score = Math.min(100, score);

  return {
    score, total_views, total_coste, cpm_real,
    detalle: { objetivo: obj_score, cpm_eficiencia: cpm_score, puntualidad: puntualidad_score, presupuesto: presupuesto_score },
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. FIABILIDAD OPERATIVA (0–100)
// ══════════════════════════════════════════════════════════════════════════════

export function calcularFiabilidadScore(
  cumple_plazos: 'si' | 'aveces' | 'no',
  factura_correctamente: 'si' | 'no',
  pred_accuracy: number | null = null,
): { score: number; etiqueta: string } {
  let score = 0;
  if (cumple_plazos === 'si')       score += 40;
  else if (cumple_plazos === 'aveces') score += 20;
  if (factura_correctamente === 'si') score += 30;
  score += pred_accuracy != null ? Math.max(0, Math.round(30 * (1 - pred_accuracy / 30))) : 15;
  score = Math.min(100, score);
  const etiqueta = score >= 75 ? 'Alta fiabilidad' : score >= 50 ? 'Fiabilidad media' : 'Fiabilidad baja';
  return { score, etiqueta };
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. AUTENTICIDAD / FRAUDE
// ══════════════════════════════════════════════════════════════════════════════

export function calcularAutenticidadHeuristica(
  seguidores: number,
  following = 0,
  pct_seguidores_reales = 100,
  views_arr: number[] | null = null,
): { score: number; flags: string[] } {
  let score = 100;
  const flags: string[] = [];

  if (following > 0 && seguidores > 0 && following > seguidores * 0.8) {
    score -= 25;
    flags.push('follow_ratio_alto');
  }

  if (pct_seguidores_reales < 60) {
    score -= 30;
    flags.push('pct_reales_bajo');
  } else if (pct_seguidores_reales < 75) {
    score -= 15;
    flags.push('pct_reales_medio');
  }

  if (views_arr && views_arr.length >= 4) {
    const mn = views_arr.reduce((a, b) => a + b, 0) / views_arr.length;
    if (mn > 0) {
      const variance = views_arr.reduce((a, v) => a + (v - mn) ** 2, 0) / views_arr.length;
      const cv = Math.sqrt(variance) / mn;
      if (cv > 1.5) {
        score -= 20;
        flags.push('cv_views_alto');
      }
    }
  }

  return { score: Math.max(0, score), flags };
}

// ══════════════════════════════════════════════════════════════════════════════
// 9. MÉTRICAS AGREGADAS DE INFLUENCER
// ══════════════════════════════════════════════════════════════════════════════

export function calcularMetricasInfluencer(colaboraciones: Record<string, unknown>[]): Record<string, unknown> {
  const avg = (key: string): number | null => {
    const vals = colaboraciones
      .map(c => Number(c[key]))
      .filter(v => !isNaN(v) && v > 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  const avgF = (key: string, dec = 2): number | null => {
    const vals = colaboraciones
      .map(c => Number(c[key]))
      .filter(v => !isNaN(v) && v > 0);
    if (!vals.length) return null;
    const f = 10 ** dec;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * f) / f;
  };

  const fechas = colaboraciones
    .map(c => (c.fecha_publicacion_real ?? c.fecha_publicacion_acordada) as string | undefined)
    .filter(Boolean)
    .sort() as string[];

  return {
    numero_campanas_trabajadas:   colaboraciones.length,
    fecha_ultima_colaboracion:    fechas.length ? fechas[fechas.length - 1] : null,
    media_views_instagram:        avg('views_reales_ig'),
    media_likes_instagram:        avg('likes_reales_ig'),
    media_comentarios_instagram:  avg('comentarios_reales_ig'),
    engagement_rate_instagram:    avgF('er_real_ig'),
    cpm_estimado_instagram:       avgF('cpm_real_ig'),
    media_views_tiktok:           avg('views_reales_tt'),
    media_likes_tiktok:           avg('likes_reales_tt'),
    media_comentarios_tiktok:     avg('comentarios_reales_tt'),
    engagement_rate_tiktok:       avgF('er_real_tt'),
    cpm_estimado_tiktok:          avgF('cpm_real_tt'),
    indice_eficiencia_precio:     avgF('cpm_real_general'),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Compute + store full profile metrics from raw scraper data
// ══════════════════════════════════════════════════════════════════════════════

export interface ScraperInfluencerData {
  // Identity
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  phone?: string | null;
  display_name?: string | null;

  // Instagram
  followers_ig?: number | null;
  following_ig?: number | null;
  avg_likes_ig?: number | null;
  avg_views_ig?: number | null;
  avg_comments_ig?: number | null;
  views_ultimos_12_ig?: number[] | null;
  pct_seguidores_reales?: number | null;

  // TikTok
  followers_tt?: number | null;
  following_tt?: number | null;
  avg_likes_tt?: number | null;
  avg_views_tt?: number | null;
  avg_comments_tt?: number | null;
  views_ultimos_12_tt?: number[] | null;

  // Reliability (from CRM history)
  cumple_plazos?: 'si' | 'aveces' | 'no' | null;
  factura_correctamente?: 'si' | 'no' | null;
  num_campanas_crm?: number | null;
}

/** Computes all derived metrics from raw scraper data and returns the full DB payload. */
export function computeInfluencerMetrics(raw: ScraperInfluencerData): Record<string, unknown> {
  const engine = new PredictionEngine();

  // IG metrics
  const er_ig = raw.followers_ig
    ? calcularEr(raw.avg_likes_ig ?? 0, raw.avg_comments_ig ?? 0, raw.followers_ig, 'ig', raw.avg_views_ig ?? 0)
    : null;
  const tendencia_ig = raw.views_ultimos_12_ig && raw.views_ultimos_12_ig.length >= 4
    ? tendenciaPct(raw.views_ultimos_12_ig)
    : null;
  const cpm_ig = raw.avg_views_ig ? calcularCpm(1000, raw.avg_views_ig) : null;

  // TT metrics
  const er_tt = raw.followers_tt
    ? calcularEr(raw.avg_likes_tt ?? 0, raw.avg_comments_tt ?? 0, raw.followers_tt, 'tt', raw.avg_views_tt ?? 0)
    : null;
  const tendencia_tt = raw.views_ultimos_12_tt && raw.views_ultimos_12_tt.length >= 4
    ? tendenciaPct(raw.views_ultimos_12_tt)
    : null;
  const cpm_tt = raw.avg_views_tt ? calcularCpm(1000, raw.avg_views_tt) : null;

  // Quality score (prefer IG)
  const qs = raw.followers_ig && er_ig != null
    ? calcularQualityScore(raw.followers_ig, er_ig, raw.avg_likes_ig ?? 0, raw.avg_comments_ig ?? 0, raw.views_ultimos_12_ig ?? null, 'ig')
    : null;

  // Autenticidad
  const auth = calcularAutenticidadHeuristica(
    raw.followers_ig ?? 0,
    raw.following_ig ?? 0,
    raw.pct_seguidores_reales ?? 100,
    raw.views_ultimos_12_ig ?? null,
  );

  // Fiabilidad
  const fiab = calcularFiabilidadScore(
    raw.cumple_plazos ?? 'no',
    raw.factura_correctamente ?? 'no',
    null,
  );

  return {
    // Identity (only if provided)
    ...(raw.display_name ? { display_name: raw.display_name } : {}),
    ...(raw.instagram_handle ? { instagram_handle: raw.instagram_handle } : {}),
    ...(raw.tiktok_handle ? { tiktok_handle: raw.tiktok_handle } : {}),

    // IG
    ...(raw.followers_ig != null ? { followers_ig: raw.followers_ig } : {}),
    ...(raw.following_ig != null ? { following_ig: raw.following_ig } : {}),
    ...(raw.avg_likes_ig != null ? { avg_likes_ig: raw.avg_likes_ig } : {}),
    ...(raw.avg_views_ig != null ? { avg_views_ig: raw.avg_views_ig } : {}),
    ...(raw.avg_comments_ig != null ? { avg_comments_ig: raw.avg_comments_ig } : {}),
    ...(raw.views_ultimos_12_ig != null ? { views_ultimos_12_ig: raw.views_ultimos_12_ig } : {}),
    ...(er_ig != null ? { engagement_rate_ig: er_ig } : {}),
    ...(tendencia_ig != null ? { tendencia_pct_ig: tendencia_ig } : {}),
    ...(cpm_ig != null ? { cpm_estimado_ig: cpm_ig } : {}),
    ...(raw.pct_seguidores_reales != null ? { pct_seguidores_reales: raw.pct_seguidores_reales } : {}),

    // TT
    ...(raw.followers_tt != null ? { followers_tt: raw.followers_tt } : {}),
    ...(raw.following_tt != null ? { following_tt: raw.following_tt } : {}),
    ...(raw.avg_likes_tt != null ? { avg_likes_tt: raw.avg_likes_tt } : {}),
    ...(raw.avg_views_tt != null ? { avg_views_tt: raw.avg_views_tt } : {}),
    ...(raw.avg_comments_tt != null ? { avg_comments_tt: raw.avg_comments_tt } : {}),
    ...(raw.views_ultimos_12_tt != null ? { views_ultimos_12_tt: raw.views_ultimos_12_tt } : {}),
    ...(er_tt != null ? { engagement_rate_tt: er_tt } : {}),
    ...(tendencia_tt != null ? { tendencia_pct_tt: tendencia_tt } : {}),
    ...(cpm_tt != null ? { cpm_estimado_tt: cpm_tt } : {}),

    // Scores
    ...(qs ? { quality_score: qs.score } : {}),
    autenticidad_score: auth.score,
    autenticidad_flags: auth.flags,
    fiabilidad_score: fiab.score,

    // Reliability raw
    ...(raw.cumple_plazos ? { cumple_plazos: raw.cumple_plazos } : {}),
    ...(raw.factura_correctamente ? { factura_correctamente: raw.factura_correctamente } : {}),
    ...(raw.num_campanas_crm != null ? { num_campanas_crm: raw.num_campanas_crm } : {}),

    last_sync_at: new Date().toISOString(),
  };
}
