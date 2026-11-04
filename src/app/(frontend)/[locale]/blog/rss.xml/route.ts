import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/domain/types'
import { routing } from '@/i18n/routing'
import { postReader } from '@/infrastructure/container'
import { siteUrl } from '@/lib/site'
import { localizedPath } from '@/seo/hreflang'

export const dynamic = 'force-dynamic'

const escapeXml = (value: string): string =>
  value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]!)

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return new Response('Not found', { status: 404 })
  const typedLocale = locale as Locale

  const t = await getTranslations({ locale: typedLocale, namespace: 'site' })
  const { items } = await postReader.list({ locale: typedLocale, limit: 30 })
  if (!items.length && typedLocale !== 'fr') return new Response('Not found', { status: 404 })

  const origin = siteUrl()
  const blogUrl = `${origin}${localizedPath(typedLocale, '/blog')}`
  const entries = items
    .map((post) => {
      const url = `${origin}${encodeURI(localizedPath(typedLocale, `/blog/${post.slug}`))}`
      return `<item><title>${escapeXml(post.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate><description>${escapeXml(post.excerpt)}</description></item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Le carnet Bento</title><link>${blogUrl}</link><description>${escapeXml(t('description'))}</description><language>${typedLocale}</language>${entries}</channel></rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900',
    },
  })
}
