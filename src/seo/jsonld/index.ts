import type { Author, Locale, MediaAsset, PostDetail } from '../../domain/types'
import { extractFaq } from '../../lib/lexical'
import { site, siteUrl } from '../../lib/site'
import { localizedPath } from '../hreflang'

export const organizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.company,
  url: site.homeUrl,
  logo: `${siteUrl()}${site.logoPath}`,
  email: site.email,
  address: { '@type': 'PostalAddress', addressLocality: site.city, addressCountry: 'MA' },
})

const absolute = (path: string): string => `${siteUrl()}${encodeURI(path)}`

const imageOf = (asset: MediaAsset | null): string | undefined => {
  if (!asset) return undefined
  if (asset.kind === 'image') return `${siteUrl()}${asset.largeUrl}`
  return asset.poster ? `${siteUrl()}${asset.poster.largeUrl}` : undefined
}

const personOf = (author: Author, locale: Locale) => ({
  '@type': 'Person',
  name: author.name,
  url: absolute(localizedPath(locale, `/blog/author/${author.slug}`)),
  ...(author.linkedin ? { sameAs: [author.linkedin] } : {}),
})

export const articleJsonLd = (post: PostDetail, locale: Locale) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.metaDescription || post.excerpt,
  inLanguage: locale,
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  mainEntityOfPage: absolute(localizedPath(locale, `/blog/${post.slug}`)),
  image: imageOf(post.hero),
  articleSection: post.category?.name,
  author: post.authors.map((author) => personOf(author, locale)),
  publisher: {
    '@type': 'Organization',
    name: site.company,
    logo: { '@type': 'ImageObject', url: `${siteUrl()}${site.logoPath}` },
  },
})

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absolute(item.path),
  })),
})

export const faqJsonLd = (post: PostDetail) => {
  const entries = extractFaq(post.body)
  if (!entries.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  }
}
