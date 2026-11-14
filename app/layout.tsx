import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { cookies, headers } from 'next/headers'
import type { Metadata, Viewport } from 'next'
import { LocaleProvider } from '@/components/locale-provider'
import { resolveLocale } from '@/lib/i18n'
import './globals.css'
import './premium-workspace.css'

export const metadata: Metadata = {
  title: 'travel AI — Your personal AI travel designer',
  description: 'Create a photo-rich, day-by-day vacation plan with thoughtful local recommendations, restaurants, excursions, and booking links. Pianifica viaggi personalizzati con consigli locali e itinerari giorno per giorno.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f6f2',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()])
  const initialLocale = resolveLocale(
    cookieStore.get('travelai-locale')?.value || requestHeaders.get('accept-language')?.split(',')[0],
  )

  return (
    <html lang={initialLocale}>
      <body className="antialiased">
        <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
        <Script id="travelpayouts-loader" src="https://tp-em.com/NTk5NzE5.js?t=599719" strategy="afterInteractive" data-cmp-ab="2" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
