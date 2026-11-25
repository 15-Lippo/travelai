import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscriptions, user } from '@/lib/db/schema'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export type SubscriptionStatus = 'active' | 'inactive' | 'unavailable'

export type SubscriptionAccess = {
  status: SubscriptionStatus
  canManageBilling: boolean
}

export function getStripePeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end
  return periodEnd ? new Date(periodEnd * 1000) : null
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
        .set({
          status: remoteSubscription.status,
          currentPeriodEnd: getStripePeriodEnd(remoteSubscription),
          updatedAt: new Date(),
        })
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

export async function recordStripeSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
) {
  const [registeredUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  if (!registeredUser) return false

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  const remoteCustomerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  if (
    remoteCustomerId !== stripeCustomerId ||
    (subscription.status !== 'active' && subscription.status !== 'trialing')
  ) {
    return false
  }

  await db
    .insert(subscriptions)
    .values({
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      status: subscription.status,
      currentPeriodEnd: getStripePeriodEnd(subscription),
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId,
        stripeSubscriptionId,
        status: subscription.status,
        currentPeriodEnd: getStripePeriodEnd(subscription),
        updatedAt: new Date(),
      },
    })

  return true
}
