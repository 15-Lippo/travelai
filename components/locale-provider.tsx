'use client'

import { createContext, useCallback, useContext, useMemo, useEffect, useState, type ReactNode } from 'react'
import { resolveLocale, translate, type Locale } from '@/lib/i18n'

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (message: string, values?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)
const STORAGE_KEY = 'travelai-locale'
const COOKIE_KEY = 'travelai-locale'

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState(initialLocale)

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    document.documentElement.lang = nextLocale

    try {
      window.localStorage.setItem(STORAGE_KEY, nextLocale)
    } catch {}

    document.cookie = `${COOKIE_KEY}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`
  }, [])

  useEffect(() => {
    let storedLocale: string | null = null

    try {
      storedLocale = window.localStorage.getItem(STORAGE_KEY)
    } catch {}

    const browserLocale = resolveLocale(window.navigator.language)
    setLocale(storedLocale === 'en' || storedLocale === 'it' ? storedLocale : browserLocale)
  }, [setLocale])

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (message, values) => translate(locale, message, values),
  }), [locale, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within LocaleProvider')
  return context
}
