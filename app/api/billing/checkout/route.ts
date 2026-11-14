import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscriptions, user } from '@/lib/db/schema'
import { ANNUAL_PLAN } from '@/lib/products'
import { getSubscriptionAccess } from '@/lib/subscriptions'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

function addCalendarMonths(date: Date, months: number) {
  const result = new Date(date)
  const dayOfMonth = result.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + months)
  const lastDayOfTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate()
  result.setUTCDate(Math.min(dayOfMonth, lastDayOfTargetMonth))
  return result
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in before starting checkout.' }, { status: 401 })
  }

  const access = await getSubscriptionAccess(session.user.id)
  if (access.status === 'active') {
    return NextResponse.json({ error: 'Your annual plan is already active.' }, { status: 409 })
  }
  if (access.status === 'unavailable') {
    return NextResponse.json({ error: 'We could not verify your plan. Please try again.' }, { status: 503 })
  }

  const [account] = await db
    .select({ createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!account) {
    return NextResponse.json({ error: 'We could not verify your account. Please try again.' }, { status: 404 })
  }

  const [existingSubscription] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1)

  const trialEnd = Math.floor(addCalendarMonths(account.createdAt, 2).getTime() / 1000)
  const now = Math.floor(Date.now() / 1000)
  const trialIsAvailable = trialEnd > now

  try {
    const origin = new URL(request.url).origin
    const checkoutSession = await stripe.checkout.sessions.create(
      {
        ui_mode: 'hosted_page',
        mode: 'subscription',
        success_url: `${origin}/api/billing/confirm?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?billing=cancelled`,
        payment_method_collection: 'always',
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
          ...(trialIsAvailable
            ? {
                trial_end: trialEnd,
                trial_settings: { end_behavior: { missing_payment_method: 'cancel' as const } },
              }
            : {}),
          metadata: { userId: session.user.id, productId: ANNUAL_PLAN.id },
        },
        metadata: { userId: session.user.id, productId: ANNUAL_PLAN.id },
      },
      { idempotencyKey: `checkout-${session.user.id}-${account.createdAt.getTime()}` },
    )

    if (!checkoutSession.url) {
      return NextResponse.json({ error: 'Stripe could not start checkout.' }, { status: 502 })
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('[v0] Could not create Stripe Checkout session:', error)
    return NextResponse.json({ error: 'Checkout is temporarily unavailable. Please try again.' }, { status: 502 })
  }
}
