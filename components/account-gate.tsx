'use client'

import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { useLocale } from '@/components/locale-provider'

export function AccountGate() {
  const { t } = useLocale()

  return (
    <section className="account-gate" aria-labelledby="account-gate-title">
      <div className="account-gate-copy">
        <span className="section-step">{t('A MORE THOUGHTFUL WAY TO TRAVEL')}</span>
        <h2 id="account-gate-title">{t('Your next trip deserves a plan that feels like you.')}</h2>
        <p>{t('A few details help your AI travel designer find the right rhythm.')}</p>
        <ul className="account-benefits">
          <li><Check aria-hidden="true" /> {t('Bespoke day-by-day itineraries shaped around your travel style')}</li>
          <li><Check aria-hidden="true" /> {t('Restaurant, excursion, and stay recommendations')}</li>
          <li><Check aria-hidden="true" /> {t('A practical booking hub for every itinerary')}</li>
        </ul>
        <p className="account-free-note"><Sparkles aria-hidden="true" /> {t('No card needed to create an account.')}</p>
      </div>

      <div className="account-card">
        <span className="account-card-label"><Sparkles aria-hidden="true" /> {t('ANNUAL MEMBERSHIP')}</span>
        <h3>€9.90{t(' / year')}</h3>
        <p>{t('Three months free, then €9.90 per year. The subscription renews annually unless cancelled.')}</p>
        <div className="account-links">
          <Link className="account-primary-button" href="/sign-up">{t('Create your account')}</Link>
          <Link className="account-secondary-link" href="/sign-in">{t('I already have an account')}</Link>
        </div>
      </div>
    </section>
  )
}
