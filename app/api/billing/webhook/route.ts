import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { STRIPE_PAYMENT_LINK_ID } from '@/lib/billing-config'
import { getStripePeriodEnd, recordStripeSubscription } from '@/lib/subscriptions'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

function stripeId(value: string | { id: string } | null) {
  return typeof value === 'string' ? value : value?.id ?? null
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook configuration is incomplete.' }, { status: 503 })
  }
  if (!signature) {
    return NextResponse.json({ error: 'Missing webhook signature.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    console.error('[v0] Stripe webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const checkout = event.data.object as Stripe.Checkout.Session
      const paymentLinkId = stripeId(checkout.payment_link)
      const customerId = stripeId(checkout.customer)
      const subscriptionId = stripeId(checkout.subscription)

      if (
        checkout.mode === 'subscription' &&
        checkout.status === 'complete' &&
        checkout.client_reference_id &&
        paymentLinkId === STRIPE_PAYMENT_LINK_ID &&
        customerId &&
        subscriptionId
      ) {
        await recordStripeSubscription(checkout.client_reference_id, customerId, subscriptionId)
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = stripeId(subscription.customer)

      if (customerId) {
        await db
          .update(subscriptions)
          .set({
            status: subscription.status,
            currentPeriodEnd: getStripePeriodEnd(subscription),
            updatedAt: new Date(),
          })
          .where(and(
            eq(subscriptions.stripeSubscriptionId, subscription.id),
            eq(subscriptions.stripeCustomerId, customerId),
          ))
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[v0] Stripe webhook processing failed:', error)
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
