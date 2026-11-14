'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plane } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLocale } from '@/components/locale-provider'

export function AuthForm({
  mode,
  redirectTo,
}: {
  mode: 'sign-in' | 'sign-up'
  redirectTo: string
}) {
  const { t } = useLocale()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [accountCreated, setAccountCreated] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function startTrialCheckout() {
    const response = await fetch('/api/billing/checkout', { method: 'POST' })
    const result = await response.json().catch(() => null)

    if (!response.ok || typeof result?.url !== 'string') {
      throw new Error(typeof result?.error === 'string'
        ? result.error
        : 'We could not start the secure checkout. Please try again.')
    }

    window.location.assign(result.url)
  }

  async function handleCheckoutRetry() {
    setError('')
    setLoading(true)

    try {
      await startTrialCheckout()
    } catch {
      setError(t('Your account is ready, but Stripe checkout could not start. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    let accountJustCreated = false

    try {
      const result = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })

      if (result.error) {
        setError(t('We could not complete that request. Check your details and try again.'))
        return
      }

      if (isSignUp) {
        accountJustCreated = true
        setAccountCreated(true)
        await startTrialCheckout()
        return
      }

      if (redirectTo.startsWith('/api/')) {
        window.location.assign(redirectTo)
        return
      }

      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError(accountJustCreated
        ? t('Your account is ready, but Stripe checkout could not start. Please try again.')
        : t('We could not complete that request. Check your connection and try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <LanguageSwitcher className="auth-language-switcher" />
        <Link className="auth-brand" href="/" aria-label={t('travel AI home')}>
          <span className="brand-mark"><Plane size={16} /></span>
          <span>travel<span className="brand-ai">AI</span></span>
        </Link>
        <p className="auth-eyebrow">{t('YOUR PERSONAL TRAVEL STUDIO')}</p>
        <h1 id="auth-title">{isSignUp ? t('Make room for somewhere wonderful.') : t('Welcome back.')}</h1>
        <p className="auth-description">
          {isSignUp
            ? t('Start with two months free from today. Your card is collected securely now, then €9.90 is charged automatically each year.')
            : t('Sign in to continue planning a trip that feels like yours.')}
        </p>

        {accountCreated ? (
          <div className="auth-form">
            <p>{t('Your account is ready. Complete Stripe checkout to start your free trial.')}</p>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="button" onClick={handleCheckoutRetry} disabled={loading} aria-busy={loading}>
              {loading ? t('Opening Stripe…') : t('Continue to Stripe')}
            </button>
          </div>
        ) : (
        <form className="auth-form" onSubmit={handleSubmit} aria-busy={loading}>
          {isSignUp && (
            <label className="auth-field" htmlFor="name">
              <span>{t('Name')}</span>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                maxLength={100}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          )}
          <label className="auth-field" htmlFor="email">
            <span>{t('Email address')}</span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="auth-field" htmlFor="password">
            <span>{t('Password')}</span>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={8}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {isSignUp && <small>{t('Use at least 8 characters.')}</small>}
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? t('Please wait…') : isSignUp ? t('Create account') : t('Sign in')}
          </button>
        </form>
        )}

        <p className="auth-switch">
          {isSignUp ? t('Already have an account?') : t('New to travel AI?')}{' '}
          <Link href={isSignUp ? '/sign-in' : '/sign-up'}>
            {isSignUp ? t('Sign in') : t('Create an account')}
          </Link>
        </p>
        <p className="auth-footnote">{t('Your account is secured with encrypted sessions. Payment details are handled by Stripe.')}</p>
      </section>
    </main>
  )
}
