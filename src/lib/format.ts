import type { Locale } from '../domain/types'

const DATE_LOCALE: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-MA' }

export const formatDate = (iso: string, locale: Locale): string =>
  new Intl.DateTimeFormat(DATE_LOCALE[locale], { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))

export const formatEntry = (entry: number | null): string => (entry ? String(entry).padStart(3, '0') : '—')

export const formatCount = (count: number): string => String(count).padStart(2, '0')
