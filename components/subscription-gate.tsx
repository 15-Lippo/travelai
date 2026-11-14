'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Check, ShieldCheck, Sparkles } from 'lucide-react'
import { useLocale } from '@/components/locale-provider'
import { ANNUAL_PLAN } from '@/lib/products'

const StripeCheckout = dynamic(
  () => import('@/components/stripe-checkout').then((module) => module.StripeCheckout),
  {
    ssr: false,
    loading: () => <CheckoutLoading />,
  },
)

type SubscriptionGateProps = {
  user: { name: string; email: string } | null
  status: 'active' | 'inactive' | 'unavailable'
  canManageBilling: boolean
}

function CheckoutLoading() {
  const { t } = useLocale()
  return <p className="subscription-loading" role="status">{t('Preparing secure checkout…')}</p>
}

export function SubscriptionGate({ user, status, canManageBilling }: SubscriptionGateProps) {
  const { locale, t } = useLocale()
  const annualPrice = new Intl.NumberFormat(locale === 'it' ? 'it-IT' : 'en-IE', {
    style: 'currency',
    currency: ANNUAL_PLAN.currency.toUpperCase(),
  }).format(ANNUAL_PLAN.priceInCents / 100)

  return (
    <section className="subscription-gate" aria-labelledby="subscription-title">
      <div className="subscription-gate-copy">
        <span className="section-step">{t('A MORE THOUGHTFUL WAY TO TRAVEL')}</span>
        <h2 id="subscription-title">{t('Your next trip deserves a plan that feels like you.')}</h2>
        <p>{t('Unlock personalized, day-by-day itineraries made around your pace, interests, and budget.')}</p>
        <ul className="subscription-benefits">
          <li><Check aria-hidden="true" /> {t('Bespoke day-by-day itineraries shaped around your travel style')}</li>
          <li><Check aria-hidden="true" /> {t('Restaurant, excursion, and stay recommendations')}</li>
          <li><Check aria-hidden="true" /> {t('A practical booking hub for every itinerary')}</li>
        </ul>
        <p className="subscription-trust"><ShieldCheck aria-hidden="true" /> {t('Secure checkout powered by Stripe')}</p>
      </div>

      <div className="subscription-plan-card">
        <span className="subscription-plan-label"><Sparkles aria-hidden="true" /> {t('ANNUAL MEMBERSHIP')}</span>
        <h3>{ANNUAL_PLAN.name}</h3>
        <p className="subscription-price"><strong>{annualPrice}</strong><span>{t(' / year')}</span></p>
        <p className="subscription-plan-description">{t('Two months free from registration, then {price} per year charged automatically. A card is required to start the trial; cancel anytime before renewal.', { price: annualPrice })}</p>

        {status === 'unavailable' && user ? (
          <p className="subscription-warning" role="alert">{t('We could not verify your plan right now. Please try again shortly.')}</p>
        ) : user ? (
          <StripeCheckout />
        ) : (
          <div className="subscription-account-links">
            <Link className="subscription-primary-button" href="/sign-up">{t('Create your account')}</Link>
            <Link className="subscription-secondary-link" href="/sign-in">{t('I already have an account')}</Link>
          </div>
        )}

        {user && canManageBilling && (
          <a className="subscription-manage-link" href="/api/billing/portal">{t('Manage existing billing')}</a>
        )}
        <p className="subscription-fine-print">{t("Your trip preferences are sent to Google's Gemini service to generate your itinerary. Payment details are handled by Stripe.")}</p>
      </div>
    </section>
  )
}
