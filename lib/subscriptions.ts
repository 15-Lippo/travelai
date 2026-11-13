import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { stripe } from '@/lib/stripe'

export type SubscriptionStatus = 'active' | 'inactive' | 'unavailable'

export type SubscriptionAccess = {
  status: SubscriptionStatus
  canManageBilling: boolean
}

export async function getSubscriptionAccess(userId: string): Promise<SubscriptionAccess> {
  try {
    const [record] = await db
      .select({
        stripeCustomerId: subscriptions.stripeCustomerId,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1)

    if (!record) return { status: 'inactive', canManageBilling: false }

    try {
      const remoteSubscription = await stripe.subscriptions.retrieve(record.stripeSubscriptionId)
      const remoteCustomerId =
        typeof remoteSubscription.customer === 'string'
          ? remoteSubscription.customer
          : remoteSubscription.customer.id

      if (remoteCustomerId !== record.stripeCustomerId) {
        return { status: 'inactive', canManageBilling: true }
      }

      const isActive = remoteSubscription.status === 'active' || remoteSubscription.status === 'trialing'

      await db
        .update(subscriptions)
        .set({ status: remoteSubscription.status, updatedAt: new Date() })
        .where(eq(subscriptions.userId, userId))

      return { status: isActive ? 'active' : 'inactive', canManageBilling: true }
    } catch (error) {
      console.error('[v0] Could not verify Stripe subscription:', error)
      return { status: 'unavailable', canManageBilling: true }
    }
  } catch (error) {
    console.error('[v0] Could not load subscription access:', error)
    return { status: 'unavailable', canManageBilling: false }
  }
}
