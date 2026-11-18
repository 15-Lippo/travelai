'use client'

import { useLocale } from '@/components/locale-provider'
import { localeNames, supportedLocales, type Locale } from '@/lib/i18n'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useLocale()

  return (
    <label className={`language-switcher ${className}`.trim()}>
      <span className="sr-only">{t('Choose language')}</span>
      <select
        aria-label={t('Choose language')}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {supportedLocales.map((language) => (
          <option key={language} value={language}>{localeNames[language]}</option>
        ))}
      </select>
    </label>
  )
}
