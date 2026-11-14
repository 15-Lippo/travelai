import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Check } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getSubscriptionAccess } from '@/lib/subscriptions'
import { resolveLocale, translate } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Membership active | travel AI',
  description: 'Your travel AI annual membership is active.',
}

export default async function BillingCompletePage() {
  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()])
  const session = await auth.api.getSession({ headers: requestHeaders })
  const locale = resolveLocale(cookieStore.get('travelai-locale')?.value || requestHeaders.get('accept-language')?.split(',')[0])
  const t = (message: string) => translate(locale, message)
  if (!session?.user) redirect('/sign-in')

  const access = await getSubscriptionAccess(session.user.id)
  if (access.status !== 'active') redirect('/')

  return (
    <main className="auth-page">
      <section className="auth-card billing-complete-card" aria-labelledby="billing-complete-title">
        <span className="billing-complete-icon"><Check aria-hidden="true" /></span>
        <p className="auth-eyebrow">{t('MEMBERSHIP CONFIRMED')}</p>
        <h1 id="billing-complete-title">{t('Somewhere wonderful')} {t('starts here.')}</h1>
        <p className="auth-description">{t('Your annual membership is active. Your personal travel studio is ready when you are.')}</p>
        <Link className="auth-submit billing-complete-link" href="/">{t('Open your trip designer')}</Link>
      </section>
    </main>
  )
}
