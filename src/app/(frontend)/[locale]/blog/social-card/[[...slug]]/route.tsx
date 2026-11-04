import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/domain/types'
import { routing } from '@/i18n/routing'
import { postReader } from '@/infrastructure/container'
import { formatDate, formatEntry } from '@/lib/format'
import { renderOgImage } from '@/seo/og-image'

type Context = { params: Promise<{ locale: string; slug?: string[] }> }

/** The image shown when a link is shared. Without a slug, the card for the blog itself. */
export async function GET(_req: Request, { params }: Context): Promise<Response> {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) return new Response('Not found', { status: 404 })
  const typedLocale = locale as Locale
  const t = await getTranslations({ locale: typedLocale, namespace: 'blog' })

  const post = slug?.[0] ? await postReader.findBySlug(decodeURIComponent(slug[0]), typedLocale, false) : null
  if (slug?.[0] && !post) return new Response('Not found', { status: 404 })

  const image = await renderOgImage(
    post
      ? {
          title: post.title,
          meta: [
            t('entry', { number: formatEntry(post.entryNumber) }),
            post.category?.name,
            formatDate(post.publishedAt, typedLocale),
          ]
            .filter((part): part is string => Boolean(part))
            .join(' · '),
          section: t('title'),
          locale: typedLocale,
        }
      : { title: t('subtitle'), meta: 'bento212.com/blog', section: t('title'), locale: typedLocale },
  )
  image.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  return image
}
