import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { STRIPE_PAYMENT_LINK_ID } from '@/lib/billing-config'
import { recordStripeSubscription } from '@/lib/subscriptions'
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
    const paymentLinkId =
      typeof checkoutSession.payment_link === 'string'
        ? checkoutSession.payment_link
        : checkoutSession.payment_link?.id

    if (
      checkoutSession.mode !== 'subscription' ||
      checkoutSession.status !== 'complete' ||
      checkoutSession.client_reference_id !== authSession.user.id ||
      paymentLinkId !== STRIPE_PAYMENT_LINK_ID
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

    const confirmed = await recordStripeSubscription(
      authSession.user.id,
      stripeCustomerId,
      stripeSubscriptionId,
    )
    if (!confirmed) return billingRedirect(request, 'pending')

    return NextResponse.redirect(new URL('/billing/complete', request.url))
  } catch (error) {
    console.error('[v0] Could not confirm Stripe subscription:', error)
    return billingRedirect(request, 'unverified')
  }
}
