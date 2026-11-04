import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'en', 'ar'],
  defaultLocale: 'fr',
  // French lives at /blog, the others at /en/blog and /ar/blog.
  localePrefix: 'as-needed',
  // Never guess from the browser: Googlebot and readers get the URL they asked for.
  localeDetection: false,
  // We emit hreflang ourselves, and only for languages a page is really translated into.
  alternateLinks: false,
})
