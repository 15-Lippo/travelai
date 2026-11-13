import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { ANNUAL_PLAN } from '@/lib/products'
import { getSubscriptionAccess } from '@/lib/subscriptions'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in before starting checkout.' }, { status: 401 })
  }

  const requestId = request.headers.get('Idempotency-Key')
  if (!requestId || !requestIdPattern.test(requestId)) {
    return NextResponse.json({ error: 'Please retry checkout.' }, { status: 400 })
  }

  const access = await getSubscriptionAccess(session.user.id)
  if (access.status === 'active') {
    return NextResponse.json({ error: 'Your annual plan is already active.' }, { status: 409 })
  }
  if (access.status === 'unavailable') {
    return NextResponse.json({ error: 'We could not verify your plan. Please try again.' }, { status: 503 })
  }

  const [existingSubscription] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1)

  try {
    const origin = new URL(request.url).origin
    const checkoutSession = await stripe.checkout.sessions.create(
      {
        ui_mode: 'embedded_page',
        redirect_on_completion: 'always',
        return_url: `${origin}/api/billing/confirm?session_id={CHECKOUT_SESSION_ID}`,
        mode: 'subscription',
        client_reference_id: session.user.id,
        ...(existingSubscription
          ? { customer: existingSubscription.stripeCustomerId }
          : { customer_email: session.user.email }),
        line_items: [
          {
            price_data: {
              currency: ANNUAL_PLAN.currency,
              product_data: {
                name: ANNUAL_PLAN.name,
                description: ANNUAL_PLAN.description,
              },
              unit_amount: ANNUAL_PLAN.priceInCents,
              recurring: { interval: ANNUAL_PLAN.interval },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: { userId: session.user.id, productId: ANNUAL_PLAN.id },
        },
        metadata: { userId: session.user.id, productId: ANNUAL_PLAN.id },
      },
      { idempotencyKey: `checkout-${session.user.id}-${requestId}` },
    )

    if (!checkoutSession.client_secret) {
      return NextResponse.json({ error: 'Stripe could not start checkout.' }, { status: 502 })
    }

    return NextResponse.json({ clientSecret: checkoutSession.client_secret })
  } catch (error) {
    console.error('[v0] Could not create Stripe Checkout session:', error)
    return NextResponse.json({ error: 'Checkout is temporarily unavailable. Please try again.' }, { status: 502 })
  }
}
