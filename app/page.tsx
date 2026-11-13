import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getSubscriptionAccess } from '@/lib/subscriptions'
import { TravelPlanner } from '@/components/travel-planner'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user ?? null
  const access = user
    ? await getSubscriptionAccess(user.id)
    : { status: 'inactive' as const, canManageBilling: false }

  return (
    <TravelPlanner
      user={user ? { name: user.name, email: user.email } : null}
      subscriptionStatus={access.status}
      canManageBilling={access.canManageBilling}
    />
  )
}
