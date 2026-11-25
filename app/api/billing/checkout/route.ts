import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isLiveStripeBillingReady, STRIPE_PAYMENT_LINK_URL } from '@/lib/billing-config'
import { getSubscriptionAccess } from '@/lib/subscriptions'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('next', '/api/billing/checkout')
    return NextResponse.redirect(signInUrl)
  }

  if (!isLiveStripeBillingReady()) {
    return NextResponse.redirect(new URL('/?billing=setup_required', request.url))
  }

  const access = await getSubscriptionAccess(session.user.id)
  if (access.status === 'active') return NextResponse.redirect(new URL('/', request.url))
  if (access.status === 'unavailable') {
    return NextResponse.redirect(new URL('/?billing=unavailable', request.url))
  }

  const paymentUrl = new URL(STRIPE_PAYMENT_LINK_URL)
  paymentUrl.searchParams.set('client_reference_id', session.user.id)
  return NextResponse.redirect(paymentUrl)
}
