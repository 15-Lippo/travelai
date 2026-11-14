'use client'

import { useLocale } from '@/components/locale-provider'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useLocale()

  return (
    <label className={`language-switcher ${className}`.trim()}>
      <span className="sr-only">{t('Choose language')}</span>
      <select
        aria-label={t('Choose language')}
        value={locale}
        onChange={(event) => setLocale(event.target.value as 'en' | 'it')}
      >
        <option value="en">EN</option>
        <option value="it">IT</option>
      </select>
    </label>
  )
}
