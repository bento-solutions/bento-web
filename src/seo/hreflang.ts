import type { Locale, LocalePaths } from '../domain/types'

const DEFAULT_LOCALE: Locale = 'fr'

/** French has no prefix: /blog, /en/blog, /ar/blog. */
export const localizedPath = (locale: Locale, path: string): string =>
  locale === DEFAULT_LOCALE ? path : `/${locale}${path}`

/**
 * hreflang entries for a page. Google needs these to be reciprocal and to point at real
 * translations, so a page that exists in one language gets none at all.
 */
export const hreflangLinks = (paths: LocalePaths, origin: string): Record<string, string> | undefined => {
  const entries = Object.entries(paths).filter(([, path]) => Boolean(path)) as [Locale, string][]
  if (entries.length < 2) return undefined
  const links: Record<string, string> = {}
  for (const [locale, path] of entries) links[locale] = `${origin}${encodeURI(path)}`
  links['x-default'] = links[DEFAULT_LOCALE] ?? `${origin}${encodeURI(entries[0][1])}`
  return links
}
