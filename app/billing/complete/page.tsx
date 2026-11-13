import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Check } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getSubscriptionAccess } from '@/lib/subscriptions'

export const metadata: Metadata = {
  title: 'Membership active | travel AI',
  description: 'Your travel AI annual membership is active.',
}

export default async function BillingCompletePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const access = await getSubscriptionAccess(session.user.id)
  if (access.status !== 'active') redirect('/')

  return (
    <main className="auth-page">
      <section className="auth-card billing-complete-card" aria-labelledby="billing-complete-title">
        <span className="billing-complete-icon"><Check aria-hidden="true" /></span>
        <p className="auth-eyebrow">MEMBERSHIP CONFIRMED</p>
        <h1 id="billing-complete-title">Somewhere wonderful starts here.</h1>
        <p className="auth-description">Your annual membership is active. Your personal travel studio is ready when you are.</p>
        <Link className="auth-submit billing-complete-link" href="/">Open your trip designer</Link>
      </section>
    </main>
  )
}
