import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

function billingRedirect(request: Request, status: string) {
  const url = new URL('/', request.url)
  url.searchParams.set('billing', status)
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id')

  if (!sessionId || sessionId.length > 255) return billingRedirect(request, 'unverified')

  const authSession = await auth.api.getSession({ headers: request.headers })
  if (!authSession?.user) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('next', `/api/billing/confirm?session_id=${encodeURIComponent(sessionId)}`)
    return NextResponse.redirect(signInUrl)
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    if (
      checkoutSession.mode !== 'subscription' ||
      checkoutSession.status !== 'complete' ||
      checkoutSession.client_reference_id !== authSession.user.id ||
      checkoutSession.metadata?.userId !== authSession.user.id
    ) {
      return billingRedirect(request, 'unverified')
    }

    const stripeSubscriptionId =
      typeof checkoutSession.subscription === 'string'
        ? checkoutSession.subscription
        : checkoutSession.subscription?.id
    const stripeCustomerId =
      typeof checkoutSession.customer === 'string'
        ? checkoutSession.customer
        : checkoutSession.customer?.id

    if (!stripeSubscriptionId || !stripeCustomerId) return billingRedirect(request, 'unverified')

    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    const subscriptionCustomerId =
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

    if (
      subscriptionCustomerId !== stripeCustomerId ||
      (subscription.status !== 'active' && subscription.status !== 'trialing')
    ) {
      return billingRedirect(request, 'pending')
    }

    await db
      .insert(subscriptions)
      .values({
        userId: authSession.user.id,
        stripeCustomerId,
        stripeSubscriptionId,
        status: subscription.status,
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          stripeCustomerId,
          stripeSubscriptionId,
          status: subscription.status,
          updatedAt: new Date(),
        },
      })

    return NextResponse.redirect(new URL('/billing/complete', request.url))
  } catch (error) {
    console.error('[v0] Could not confirm Stripe subscription:', error)
    return billingRedirect(request, 'unverified')
  }
}
