import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSubscriptionAccess } from '@/lib/subscriptions'

export async function requireActiveSubscription(request: Request) {
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

  const access = await getSubscriptionAccess(session.user.id)

  if (access.status === 'unavailable') {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'We could not verify your plan. Please try again.' },
        { status: 503 },
      ),
    }
  }

  if (access.status !== 'active') {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'An active annual plan is required to create travel content.', code: 'SUBSCRIPTION_REQUIRED' },
        { status: 402 },
      ),
    }
  }

  return { ok: true as const, user: session.user }
}
