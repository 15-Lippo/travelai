import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getSubscriptionAccess } from '@/lib/subscriptions'
import { AccountGate } from '@/components/account-gate'
import { SubscriptionGate } from '@/components/subscription-gate'
import { TravelPlanner } from '@/components/travel-planner'
import { isLiveStripeBillingReady } from '@/lib/billing-config'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user ?? null
  const access = user
    ? await getSubscriptionAccess(user.id)
    : { status: 'inactive' as const, canManageBilling: false }

  if (!user) return <AccountGate />
  if (access.status !== 'active') {
    return (
      <SubscriptionGate
        status={access.status}
        canManageBilling={access.canManageBilling}
        billingReady={isLiveStripeBillingReady()}
      />
    )
  }

  return (
    <TravelPlanner
      user={{ name: user.name, email: user.email }}
      canManageBilling={access.canManageBilling}
    />
  )
}
