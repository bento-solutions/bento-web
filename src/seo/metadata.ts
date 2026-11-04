import type { Metadata } from 'next'

import type { Locale, LocalePaths, PostDetail } from '../domain/types'
import { siteUrl } from '../lib/site'
import { hreflangLinks, localizedPath } from './hreflang'

const OG_LOCALE: Record<Locale, string> = { fr: 'fr_MA', en: 'en_GB', ar: 'ar_MA' }

const noIndexSite = (): boolean => process.env.SITE_NOINDEX === '1'

const socialImage = (locale: Locale, slug?: string) => {
  const suffix = slug ? `/${encodeURIComponent(slug)}` : ''
  return { url: localizedPath(locale, `/blog/social-card${suffix}`), width: 1200, height: 630, alt: 'Le carnet Bento' }
}

type PageMetadataInput = {
  locale: Locale
  path: string
  title: string | { absolute: string }
  description: string
  paths?: LocalePaths
  noindex?: boolean
  /** Article the social card is generated from. Leave empty for the blog's own card. */
  slug?: string
}

export const pageMetadata = ({ locale, path, title, description, paths, noindex, slug }: PageMetadataInput): Metadata => {
  const origin = siteUrl()
  const canonical = `${origin}${encodeURI(localizedPath(locale, path))}`
  const plainTitle = typeof title === 'string' ? title : title.absolute
  const image = socialImage(locale, slug)
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: paths ? hreflangLinks(paths, origin) : undefined,
    },
    openGraph: {
      type: 'website',
      siteName: 'Le carnet Bento',
      title: plainTitle,
      description,
      url: canonical,
      locale: OG_LOCALE[locale],
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: plainTitle, description, images: [image.url] },
    robots: noindex || noIndexSite() ? { index: false, follow: false } : undefined,
  }
}

export const articleMetadata = (post: PostDetail, locale: Locale): Metadata => {
  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt
  const base = pageMetadata({
    locale,
    path: `/blog/${post.slug}`,
    title,
    description,
    paths: post.alternates,
    noindex: post.noindex,
    slug: post.slug,
  })
  return {
    ...base,
    alternates: {
      ...base.alternates,
      canonical: post.canonicalUrl || base.alternates?.canonical,
    },
    authors: post.authors.map((author) => ({ name: author.name })),
    openGraph: {
      ...base.openGraph,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.authors.map((author) => author.name),
      section: post.category?.name,
    },
  }
}
