'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

type AccountActionsProps = {
  user: { name: string; email: string } | null
  canManageBilling: boolean
}

export function AccountActions({ user, canManageBilling }: AccountActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignOut() {
    setLoading(true)
    setError('')

    try {
      const result = await authClient.signOut()
      if (result.error) {
        setError('Sign out could not be completed. Please try again.')
        return
      }
      router.replace('/')
      router.refresh()
    } catch {
      setError('Sign out could not be completed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="workspace-account-actions">
        <a className="workspace-account-link" href="/sign-in">Sign in</a>
      </div>
    )
  }

  return (
    <div className="workspace-account-actions">
      <span className="workspace-account-identity" title={user.email}>{user.name || user.email}</span>
      {canManageBilling && <a className="workspace-billing-link" href="/api/billing/portal">Billing</a>}
      <button className="workspace-account-button" type="button" onClick={handleSignOut} disabled={loading}>
        {loading ? 'Signing out…' : 'Sign out'}
      </button>
      {error && <span className="workspace-account-error" role="alert">{error}</span>}
    </div>
  )
}
