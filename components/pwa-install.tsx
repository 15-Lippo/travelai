'use client'

import { useEffect, useState } from 'react'
import { Download, Share } from 'lucide-react'
import { useLocale } from '@/components/locale-provider'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PWAInstall() {
  const { t } = useLocale()
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)

    setIsInstalled(standalone)
    setIsIOS(ios)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    }

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const handleInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  if (isInstalled || (!installPrompt && !isIOS)) return null

  async function installApp() {
    if (isIOS) {
      setShowInstructions((visible) => !visible)
      return
    }

    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  return (
    <div className="pwa-install-wrap">
      <button className="pwa-install-button" type="button" onClick={installApp} aria-label={t('Install travel AI')}>
        <Download size={15} aria-hidden="true" />
        <span>{t('Install')}</span>
      </button>
      {showInstructions && isIOS && (
        <p className="pwa-install-hint" role="status">
          <Share size={14} aria-hidden="true" />
          {t('Tap Share, then Add to Home Screen.')}
        </p>
      )}
    </div>
  )
}
