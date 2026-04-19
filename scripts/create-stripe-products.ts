/**
 * Script para crear los 4 productos de suscripción en Stripe.
 *
 * Ejecutar UNA sola vez (idempotente por nombre — si ya existen los reutiliza).
 *
 *   npx tsx scripts/create-stripe-products.ts
 *
 * Genera .stripe-prices.json con los price_ids para pegar en .env.local y Vercel.
 *
 * Requiere: STRIPE_SECRET_KEY en entorno (cargar .env.local primero).
 */

import Stripe from 'stripe';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Cargar .env.local manualmente (sin dotenv como dependencia)
const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Falta STRIPE_SECRET_KEY en .env.local');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });

// Configuración de los 4 productos (price_cents = precio mensual en céntimos)
const PRODUCTS = [
  {
    key: 'brand_starter',
    name: 'Connectly Starter (Marca)',
    description: 'Para marcas que hacen 1-2 colaboraciones al mes. 5 collabs activas, candidatos ilimitados, búsqueda avanzada.',
    price_cents: 1900,
    role: 'brand',
    plan: 'starter',
  },
  {
    key: 'brand_pro',
    name: 'Connectly Pro (Marca)',
    description: 'Para marcas profesionales. Colaboraciones ilimitadas, IA de afinidad, reportes ROI, soporte prioritario.',
    price_cents: 4900,
    role: 'brand',
    plan: 'pro',
  },
  {
    key: 'creator_starter',
    name: 'Connectly Starter (Creador)',
    description: '15 aplicaciones al mes, perfil destacado en el discover, analytics básicos, badge verificado.',
    price_cents: 400,
    role: 'influencer',
    plan: 'starter',
  },
  {
    key: 'creator_pro',
    name: 'Connectly Pro (Creador)',
    description: 'Aplicaciones ilimitadas, #1 en tu categoría 1 día/mes, boost 3 días mensual, campañas exclusivas.',
    price_cents: 900,
    role: 'influencer',
    plan: 'pro',
  },
] as const;

async function findOrCreateProduct(name: string, description: string, metadata: Record<string, string>) {
  // Buscar por nombre en productos activos
  const { data: existing } = await stripe.products.list({ active: true, limit: 100 });
  const found = existing.find(p => p.name === name);
  if (found) {
    console.log(`  ✓ Producto ya existe: ${name} (${found.id})`);
    return found;
  }

  const product = await stripe.products.create({ name, description, metadata });
  console.log(`  ➕ Producto creado: ${name} (${product.id})`);
  return product;
}

async function findOrCreatePrice(productId: string, amountCents: number) {
  const { data: existing } = await stripe.prices.list({ product: productId, active: true, limit: 10 });
  const found = existing.find(p =>
    p.unit_amount === amountCents &&
    p.currency === 'eur' &&
    p.recurring?.interval === 'month'
  );
  if (found) {
    console.log(`    ✓ Precio ya existe: ${amountCents / 100}€/mes (${found.id})`);
    return found;
  }

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amountCents,
    currency: 'eur',
    recurring: { interval: 'month' },
  });
  console.log(`    ➕ Precio creado: ${amountCents / 100}€/mes (${price.id})`);
  return price;
}

async function main() {
  console.log('🔨 Creando productos y precios en Stripe...\n');

  const results: Record<string, string> = {};

  for (const p of PRODUCTS) {
    console.log(`→ ${p.key}`);
    const product = await findOrCreateProduct(p.name, p.description, {
      role: p.role,
      plan: p.plan,
    });
    const price = await findOrCreatePrice(product.id, p.price_cents);
    results[`STRIPE_PRICE_${p.key.toUpperCase()}`] = price.id;
    console.log();
  }

  // Guardar archivo de referencia
  const outPath = resolve(process.cwd(), '.stripe-prices.json');
  writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ Completado. Copia estas líneas a .env.local Y a Vercel:');
  console.log('═══════════════════════════════════════════════════\n');
  for (const [key, id] of Object.entries(results)) {
    console.log(`${key}=${id}`);
  }
  console.log(`\nReferencia también guardada en: ${outPath}`);
  console.log('\n⚠️  Después de añadir las env vars, redeploya Vercel.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
