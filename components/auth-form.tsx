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
  const isSignUp = mode === 'sign-up'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })

      if (result.error) {
        setError(t('We could not complete that request. Check your details and try again.'))
        return
      }

      if (redirectTo.startsWith('/api/')) {
        window.location.assign(redirectTo)
        return
      }

      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError(t('We could not complete that request. Check your connection and try again.'))
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
            ? t('Create a free account—no subscription or payment required.')
            : t('Sign in to continue planning a trip that feels like yours.')}
        </p>

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

        <p className="auth-switch">
          {isSignUp ? t('Already have an account?') : t('New to travel AI?')}{' '}
          <Link href={isSignUp ? '/sign-in' : '/sign-up'}>
            {isSignUp ? t('Sign in') : t('Create an account')}
          </Link>
        </p>
        <p className="auth-footnote">{t('Your account is secured with encrypted sessions.')}</p>
      </section>
    </main>
  )
}
