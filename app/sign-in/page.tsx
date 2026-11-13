import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'
import { auth } from '@/lib/auth'
import { getSafeRedirectPath } from '@/lib/safe-redirect'

export const metadata: Metadata = {
  title: 'Sign in | travel AI',
  description: 'Sign in to continue planning your next trip.',
}

type SignInPageProps = {
  searchParams: Promise<{ next?: string | string[] }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const requestHeaders = await headers()
  const [session, params] = await Promise.all([
    auth.api.getSession({ headers: requestHeaders }),
    searchParams,
  ])
  const redirectTo = getSafeRedirectPath(params.next)

  if (session?.user) redirect(redirectTo)

  return <AuthForm mode="sign-in" redirectTo={redirectTo} />
}
