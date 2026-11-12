import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import './day-guides.css'
import './vacation-agent.css'

export const metadata: Metadata = {
  title: 'travel AI — Your personal vacation designer',
  description: 'Plan a remarkable, personalized vacation with a thoughtful AI travel agent.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f8f5ef',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
