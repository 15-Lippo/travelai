'use client'

import { useCallback, useMemo, useState } from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null)

export function StripeCheckout() {
  const [error, setError] = useState('')

  const getClientSecret = useCallback(async () => {
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    })
    const result = await response.json().catch(() => null)

    if (!response.ok || typeof result?.clientSecret !== 'string') {
      const message = typeof result?.error === 'string'
        ? result.error
        : 'Checkout could not be started. Please try again.'
      setError(message)
      throw new Error(message)
    }

    return result.clientSecret as string
  }, [])

  const options = useMemo(() => ({ fetchClientSecret: getClientSecret }), [getClientSecret])

  if (!publishableKey) {
    return <p className="subscription-warning" role="alert">Secure checkout is not configured yet.</p>
  }

  return (
    <div className="stripe-checkout" aria-label="Secure Stripe checkout">
      {error ? (
        <div className="subscription-checkout-error" role="alert">
          <p>{error}</p>
          <button className="subscription-secondary-button" type="button" onClick={() => setError('')}>Try again</button>
        </div>
      ) : (
        <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      )}
    </div>
  )
}
