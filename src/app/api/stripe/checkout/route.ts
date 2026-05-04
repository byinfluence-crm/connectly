import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, calcFees } from '@/lib/stripe';
import { requireOwnUser } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { ugc_project_id, collab_id, payer_user_id, payee_user_id, amount_euros } =
      await req.json() as {
        ugc_project_id?: string;
        collab_id?: string;
        payer_user_id: string;
        payee_user_id: string;
        amount_euros: number;
      };

    if (!payer_user_id || !payee_user_id || !amount_euros) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }
    if (!ugc_project_id && !collab_id) {
      return NextResponse.json({ error: 'Requiere ugc_project_id o collab_id' }, { status: 400 });
    }

    const auth = await requireOwnUser(req, payer_user_id);
    if (!auth.authorized) return auth.response;

    const type = ugc_project_id ? 'ugc' : 'collab';
    const grossCents = Math.round(amount_euros * 100);
    const fees = calcFees(grossCents, type);

    // Obtener título del proyecto/collab para el line item
    let projectTitle = 'Proyecto Connectly';
    if (ugc_project_id) {
      const { data } = await supabaseAdmin.from('ugc_projects').select('title').eq('id', ugc_project_id).single();
      if (data) projectTitle = data.title;
    }

    // Crear escrow en estado pending_payment
    const { data: escrow, error: escrowErr } = await supabaseAdmin
      .from('escrow_payments')
      .insert({
        payer_user_id,
        payee_user_id,
        ugc_project_id: ugc_project_id ?? null,
        collab_id: collab_id ?? null,
        ...fees,
        status: 'held',  // se confirma en el webhook
      })
      .select('id')
      .single();

    if (escrowErr || !escrow) {
      return NextResponse.json({ error: 'No se pudo crear el escrow' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002';
    const returnPath = ugc_project_id
      ? `/dashboard/brand/ugc/${ugc_project_id}`
      : `/dashboard/brand/collabs`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      currency: 'eur',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: projectTitle,
              description: `Connectly — comisión de plataforma ${type === 'ugc' ? '20%' : '10%'} incluida`,
            },
            unit_amount: grossCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}${returnPath}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${returnPath}?payment=cancelled`,
      metadata: {
        escrow_id: escrow.id,
        payer_user_id,
        payee_user_id,
        project_type: type,
        ...(ugc_project_id ? { ugc_project_id } : { collab_id: collab_id! }),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe/checkout]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
