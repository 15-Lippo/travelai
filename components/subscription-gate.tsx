'use client'

import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react'
import { useLocale } from '@/components/locale-provider'

type SubscriptionGateProps = {
  status: 'inactive' | 'unavailable'
  canManageBilling: boolean
  billingReady: boolean
}

export function SubscriptionGate({ status, canManageBilling, billingReady }: SubscriptionGateProps) {
  const { t } = useLocale()
  const verificationUnavailable = status === 'unavailable'

  return (
    <section className="account-gate" aria-labelledby="subscription-gate-title">
      <div className="account-gate-copy">
        <span className="section-step">{t('A MORE THOUGHTFUL WAY TO TRAVEL')}</span>
        <h2 id="subscription-gate-title">{t('Your next trip deserves a plan that feels like you.')}</h2>
        <p>{t('Unlock personalized, day-by-day itineraries made around your pace, interests, and budget.')}</p>
        <ul className="account-benefits">
          <li><Check aria-hidden="true" /> {t('Bespoke day-by-day itineraries shaped around your travel style')}</li>
          <li><Check aria-hidden="true" /> {t('Restaurant, excursion, and stay recommendations')}</li>
          <li><Check aria-hidden="true" /> {t('A practical booking hub for every itinerary')}</li>
        </ul>
        <p className="account-free-note"><ShieldCheck aria-hidden="true" /> {t('Secure checkout powered by Stripe')}</p>
      </div>

      <div className="account-card">
        <span className="account-card-label"><Sparkles aria-hidden="true" /> {t('ANNUAL MEMBERSHIP')}</span>
        <h3>€9.90{t(' / year')}</h3>
        <p>{t('Three months free, then €9.90 per year. The subscription renews annually unless cancelled.')}</p>
        {verificationUnavailable && (
          <p className="workspace-error" role="status">{t('We could not verify your plan right now. Please try again shortly.')}</p>
        )}
        {!billingReady && (
          <p className="workspace-error" role="status">{t('Live Stripe checkout is not configured yet.')}</p>
        )}
        <div className="account-links">
          {!verificationUnavailable && billingReady && (
            <a className="account-primary-button" href="/api/billing/checkout" target="_blank" rel="noreferrer">
              {t('Start your 3-month free trial')} <ArrowRight aria-hidden="true" />
            </a>
          )}
          {canManageBilling && (
            <Link className="account-secondary-link" href="/api/billing/portal">{t('Manage existing billing')}</Link>
          )}
          <small>{t('Your trip preferences are sent to Google\'s Gemini service to generate your itinerary. Payment details are handled by Stripe.')}</small>
        </div>
      </div>
    </section>
  )
}
