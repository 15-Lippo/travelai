'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plane } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export function AuthForm({
  mode,
  redirectTo,
}: {
  mode: 'sign-in' | 'sign-up'
  redirectTo: string
}) {
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
        setError('We could not complete that request. Check your details and try again.')
        return
      }

      if (redirectTo.startsWith('/api/')) {
        window.location.assign(redirectTo)
        return
      }

      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError('We could not complete that request. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-brand" href="/" aria-label="travel AI home">
          <span className="brand-mark"><Plane size={16} /></span>
          <span>travel<span className="brand-ai">AI</span></span>
        </Link>
        <p className="auth-eyebrow">YOUR PERSONAL TRAVEL STUDIO</p>
        <h1 id="auth-title">{isSignUp ? 'Make room for somewhere wonderful.' : 'Welcome back.'}</h1>
        <p className="auth-description">
          {isSignUp
            ? 'Create an account to unlock your annual travel-planning membership.'
            : 'Sign in to continue planning a trip that feels like yours.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit} aria-busy={loading}>
          {isSignUp && (
            <label className="auth-field" htmlFor="name">
              <span>Name</span>
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
            <span>Email address</span>
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
            <span>Password</span>
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
            {isSignUp && <small>Use at least 8 characters.</small>}
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignUp ? 'Already have an account?' : 'New to travel AI?'}{' '}
          <Link href={isSignUp ? '/sign-in' : '/sign-up'}>
            {isSignUp ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
        <p className="auth-footnote">Your account is secured with encrypted sessions. Payment details are handled by Stripe.</p>
      </section>
    </main>
  )
}
