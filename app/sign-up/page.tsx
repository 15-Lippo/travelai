import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'
import { auth } from '@/lib/auth'
import { getSafeRedirectPath } from '@/lib/safe-redirect'

export const metadata: Metadata = {
  title: 'Create account | travel AI',
  description: 'Create an account to unlock personalized AI trip planning.',
}

type SignUpPageProps = {
  searchParams: Promise<{ next?: string | string[] }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const requestHeaders = await headers()
  const [session, params] = await Promise.all([
    auth.api.getSession({ headers: requestHeaders }),
    searchParams,
  ])
  const redirectTo = getSafeRedirectPath(params.next)

  if (session?.user) redirect(redirectTo)

  return <AuthForm mode="sign-up" redirectTo={redirectTo} />
}
