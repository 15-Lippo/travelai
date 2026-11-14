'use client'

import { useState } from 'react'
import { useLocale } from '@/components/locale-provider'

export function StripeCheckout() {
  const { t } = useLocale()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function startCheckout() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/billing/checkout', { method: 'POST' })
      const result = await response.json().catch(() => null)

      if (!response.ok || typeof result?.url !== 'string') {
        throw new Error(typeof result?.error === 'string'
          ? result.error
          : t('Checkout could not be started. Please try again.'))
      }

      window.location.assign(result.url)
    } catch (checkoutError) {
      setError(checkoutError instanceof Error
        ? checkoutError.message
        : t('Checkout could not be started. Please try again.'))
      setLoading(false)
    }
  }

  return (
    <div className="stripe-checkout" aria-label={t('Secure Stripe checkout')}>
      <button
        className="subscription-primary-button"
        type="button"
        onClick={startCheckout}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? t('Opening secure checkout…') : t('Start your 2-month free trial')}
      </button>
      {error && <p className="subscription-warning" role="alert">{error}</p>}
    </div>
  )
}
