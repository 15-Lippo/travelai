'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Check, ShieldCheck, Sparkles } from 'lucide-react'
import { ANNUAL_PLAN } from '@/lib/products'

const StripeCheckout = dynamic(
  () => import('@/components/stripe-checkout').then((module) => module.StripeCheckout),
  {
    ssr: false,
    loading: () => <p className="subscription-loading" role="status">Preparing secure checkout…</p>,
  },
)

type SubscriptionGateProps = {
  user: { name: string; email: string } | null
  status: 'active' | 'inactive' | 'unavailable'
  canManageBilling: boolean
}

const annualPrice = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: ANNUAL_PLAN.currency.toUpperCase(),
}).format(ANNUAL_PLAN.priceInCents / 100)

export function SubscriptionGate({ user, status, canManageBilling }: SubscriptionGateProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <section className="subscription-gate" aria-labelledby="subscription-title">
      <div className="subscription-gate-copy">
        <span className="section-step">A MORE THOUGHTFUL WAY TO TRAVEL</span>
        <h2 id="subscription-title">Your next trip deserves a plan that feels like <em>you.</em></h2>
        <p>Unlock personalized, day-by-day itineraries made around your pace, interests, and budget.</p>
        <ul className="subscription-benefits">
          <li><Check aria-hidden="true" /> Bespoke day-by-day itineraries shaped around your travel style</li>
          <li><Check aria-hidden="true" /> Restaurant, excursion, and stay recommendations</li>
          <li><Check aria-hidden="true" /> A practical booking hub for every itinerary</li>
        </ul>
        <p className="subscription-trust"><ShieldCheck aria-hidden="true" /> Secure checkout powered by Stripe</p>
      </div>

      <div className="subscription-plan-card">
        <span className="subscription-plan-label"><Sparkles aria-hidden="true" /> ANNUAL MEMBERSHIP</span>
        <h3>{ANNUAL_PLAN.name}</h3>
        <p className="subscription-price"><strong>{annualPrice}</strong><span> / year</span></p>
        <p className="subscription-plan-description">Billed annually in EUR. Cancel anytime in the billing portal.</p>

        {status === 'unavailable' && user ? (
          <p className="subscription-warning" role="alert">We could not verify your plan right now. Please try again shortly.</p>
        ) : user ? (
          checkoutOpen ? (
            <div className="subscription-checkout-panel">
              <StripeCheckout />
              <button className="subscription-secondary-button" type="button" onClick={() => setCheckoutOpen(false)}>
                Back to plan details
              </button>
            </div>
          ) : (
            <button className="subscription-primary-button" type="button" onClick={() => setCheckoutOpen(true)}>
              Continue to secure checkout
            </button>
          )
        ) : (
          <div className="subscription-account-links">
            <Link className="subscription-primary-button" href="/sign-up">Create your account</Link>
            <Link className="subscription-secondary-link" href="/sign-in">I already have an account</Link>
          </div>
        )}

        {user && canManageBilling && (
          <a className="subscription-manage-link" href="/api/billing/portal">Manage existing billing</a>
        )}
        <p className="subscription-fine-print">Your trip preferences are sent to Google&apos;s Gemini service to generate your itinerary. Payment details are handled by Stripe.</p>
      </div>
    </section>
  )
}
