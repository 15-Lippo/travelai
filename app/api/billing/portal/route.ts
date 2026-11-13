import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.redirect(new URL('/sign-in', request.url))

  const [subscription] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1)

  if (!subscription) return NextResponse.redirect(new URL('/', request.url))

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: new URL('/', request.url).toString(),
    })
    return NextResponse.redirect(portalSession.url)
  } catch (error) {
    console.error('[v0] Could not create Stripe billing portal session:', error)
    return NextResponse.redirect(new URL('/?billing=unavailable', request.url))
  }
}
