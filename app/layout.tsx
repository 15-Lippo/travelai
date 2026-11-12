import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'travel AI — Your personal AI travel designer',
  description: 'Create a photo-rich, day-by-day vacation plan with thoughtful local recommendations, restaurants, excursions, and booking links.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f8f5ef',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased">{children}<Script id="travelpayouts-loader" src="https://tp-em.com/NTk5NzE5.js?t=599719" strategy="afterInteractive" data-cmp-ab="2" />{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
