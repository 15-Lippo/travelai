import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSubscriptionAccess } from '@/lib/subscriptions'

export async function requireSignedInUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Sign in to use the trip designer.', code: 'AUTH_REQUIRED' },
        { status: 401 },
      ),
    }
  }

  return { ok: true as const, user: session.user }
}

export async function requirePaidUser(request: Request) {
  const signedIn = await requireSignedInUser(request)
  if (!signedIn.ok) return signedIn

  const access = await getSubscriptionAccess(signedIn.user.id)
  if (access.status === 'active') return signedIn

  return {
    ok: false as const,
    response: NextResponse.json(
      {
        error: access.status === 'unavailable'
          ? 'Subscription verification is temporarily unavailable.'
          : 'An active subscription is required to create a travel plan.',
        code: access.status === 'unavailable' ? 'SUBSCRIPTION_UNAVAILABLE' : 'SUBSCRIPTION_REQUIRED',
      },
      { status: access.status === 'unavailable' ? 503 : 402 },
    ),
  }
}
