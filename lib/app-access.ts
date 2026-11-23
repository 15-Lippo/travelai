import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

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
