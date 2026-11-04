import { type Payload, type Where } from 'payload'

import type { PostQuery, PostReader, RedirectReader, TaxonomyReader } from '../domain/ports'
import type {
  Author,
  Category,
  CategoryWithCount,
  Locale,
  LocalePaths,
  Paginated,
  PostDetail,
  PostSummary,
  SitemapEntry,
} from '../domain/types'
import type { LexicalDocument } from '../lib/lexical'
import { typeset, typesetDocument } from '../lib/typography'
import type {
  Author as PayloadAuthor,
  Category as PayloadCategory,
  Post as PayloadPost,
} from '../payload-types'
import { localizedPath } from '../seo/hreflang'
import { mapImage, mapMedia } from './media-mapper'

const LOCALES: Locale[] = ['fr', 'en', 'ar']
const FALLBACK_LOCALE = 'fr'
const EMPTY_BODY: LexicalDocument = { root: { type: 'root', children: [] } }

type GetPayload = () => Promise<Payload>

const mapCategory = (category: PayloadCategory | number | null | undefined): Category | null => {
  if (!category || typeof category === 'number') return null
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description ?? null,
    tone: category.tone,
  }
}

const mapAuthor = (author: PayloadAuthor | number): Author | null => {
  if (typeof author === 'number') return null
  return {
    id: author.id,
    slug: author.slug,
    name: author.name,
    jobTitle: author.jobTitle ?? null,
    bio: author.bio ?? null,
    avatar: mapImage(author.avatar),
    linkedin: author.linkedin ?? null,
  }
}

const mapSummary = (post: PayloadPost, locale: Locale): PostSummary => ({
  id: post.id,
  entryNumber: post.entryNumber ?? null,
  slug: post.slug,
  // A draft in live preview can still be missing everything except its id.
  title: typeset(post.title ?? '', locale),
  excerpt: typeset(post.excerpt ?? '', locale),
  publishedAt: post.publishedAt ?? post.createdAt,
  updatedAt: post.updatedAt,
  readingMinutes: post.readingMinutes ?? 1,
  featured: Boolean(post.featured),
  category: mapCategory(post.category),
  authors: (post.authors ?? []).map(mapAuthor).filter((a): a is Author => a !== null),
  hero: mapMedia(post.hero),
})

const SUMMARY_SELECT = {
  entryNumber: true,
  slug: true,
  title: true,
  excerpt: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  readingMinutes: true,
  featured: true,
  category: true,
  authors: true,
  hero: true,
} as const

/**
 * Published, and actually written in this language rather than falling back to French.
 * A translator's half-saved title does not count: the body has to exist too.
 */
const liveIn = (): Where[] => [
  { _status: { equals: 'published' } },
  { slug: { exists: true } },
  { body: { exists: true } },
]

const articlePath = (locale: Locale, slug: string): string => localizedPath(locale, `/blog/${slug}`)

/** Payload returns `{ fr: 'x', en: 'y' }` for `locale: 'all'`. Empty languages are left out. */
const readLocalized = (value: unknown): Partial<Record<Locale, string>> => {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === 'string' && v)) as Partial<
    Record<Locale, string>
  >
}

/** Article paths in the languages where the post has both a slug and a body. */
const translatedPaths = (doc: { slug?: unknown; body?: unknown }): LocalePaths => {
  const slugs = readLocalized(doc.slug)
  const bodies = (doc.body ?? {}) as Partial<Record<Locale, unknown>>
  return Object.fromEntries(
    (Object.entries(slugs) as [Locale, string][])
      .filter(([locale]) => Boolean(bodies[locale]))
      .map(([locale, slug]) => [locale, articlePath(locale, slug)]),
  )
}

export class PayloadPostReader implements PostReader {
  constructor(private readonly getPayload: GetPayload) {}

  async findBySlug(slug: string, locale: Locale, draft: boolean): Promise<PostDetail | null> {
    const payload = await this.getPayload()
    const { docs } = await payload.find({
      collection: 'posts',
      locale,
      fallbackLocale: FALLBACK_LOCALE,
      draft,
      depth: 2,
      limit: 1,
      where: draft ? { slug: { equals: slug } } : { and: [...liveIn(), { slug: { equals: slug } }] },
    })
    const post = docs[0]
    if (!post) return null

    const alternates = await this.alternates(post.id, draft)
    const relatedDocs = (post.relatedPosts ?? []).filter(
      (related): related is PayloadPost =>
        typeof related === 'object' && related._status === 'published' && Boolean(related.slug),
    )

    return {
      ...mapSummary(post, locale),
      body: post.body ? typesetDocument(post.body as unknown as LexicalDocument, locale) : EMPTY_BODY,
      metaTitle: post.meta?.title ?? null,
      metaDescription: post.meta?.description ?? null,
      metaImage: mapImage(post.meta?.image),
      noindex: Boolean(post.meta?.noindex),
      canonicalUrl: post.meta?.canonicalUrl ?? null,
      alternates,
      related: relatedDocs.map((related) => mapSummary(related, locale)),
    }
  }

  private async alternates(id: number, draft: boolean): Promise<LocalePaths> {
    const payload = await this.getPayload()
    const doc = await payload.findByID({
      collection: 'posts',
      id,
      locale: 'all',
      depth: 0,
      draft,
      select: { slug: true, body: true },
    })
    return translatedPaths(doc)
  }

  async list({ locale, page = 1, limit = 20, categoryId, authorId, excludeIds }: PostQuery): Promise<Paginated<PostSummary>> {
    const payload = await this.getPayload()
    const conditions: Where[] = [...liveIn()]
    if (categoryId) conditions.push({ category: { equals: categoryId } })
    if (authorId) conditions.push({ authors: { contains: authorId } })
    if (excludeIds?.length) conditions.push({ id: { not_in: excludeIds } })

    const result = await payload.find({
      collection: 'posts',
      locale,
      fallbackLocale: FALLBACK_LOCALE,
      depth: 2,
      page,
      limit,
      sort: '-publishedAt',
      where: { and: conditions },
      select: SUMMARY_SELECT,
    })
    return {
      items: (result.docs as PayloadPost[]).map((post) => mapSummary(post, locale)),
      page: result.page ?? page,
      totalPages: result.totalPages,
      total: result.totalDocs,
    }
  }

  async featured(locale: Locale): Promise<PostSummary | null> {
    const payload = await this.getPayload()
    const { docs } = await payload.find({
      collection: 'posts',
      locale,
      fallbackLocale: FALLBACK_LOCALE,
      depth: 2,
      limit: 1,
      sort: '-publishedAt',
      where: { and: [...liveIn(), { featured: { equals: true } }] },
      select: SUMMARY_SELECT,
    })
    return docs[0] ? mapSummary(docs[0] as PayloadPost, locale) : null
  }

  async liveLocales(): Promise<Locale[]> {
    const payload = await this.getPayload()
    const counts = await Promise.all(
      LOCALES.map(async (locale) => {
        const { totalDocs } = await payload.count({ collection: 'posts', locale, where: { and: liveIn() } })
        return [locale, totalDocs] as const
      }),
    )
    return counts.filter(([, total]) => total > 0).map(([locale]) => locale)
  }

  async sitemapEntries(): Promise<SitemapEntry[]> {
    const payload = await this.getPayload()
    const { docs } = await payload.find({
      collection: 'posts',
      locale: 'all',
      depth: 0,
      limit: 5000,
      pagination: false,
      where: { _status: { equals: 'published' } },
      select: { slug: true, body: true, updatedAt: true, meta: { noindex: true } },
    })
    return docs
      .filter((doc) => !doc.meta?.noindex)
      .map((doc) => ({ lastModified: doc.updatedAt, paths: translatedPaths(doc) }))
  }
}

export class PayloadTaxonomyReader implements TaxonomyReader {
  constructor(private readonly getPayload: GetPayload) {}

  async categories(locale: Locale): Promise<CategoryWithCount[]> {
    const payload = await this.getPayload()
    const { docs } = await payload.find({
      collection: 'categories',
      locale,
      fallbackLocale: FALLBACK_LOCALE,
      depth: 0,
      limit: 100,
      pagination: false,
      sort: 'displayOrder',
    })
    const withCounts = await Promise.all(
      docs.map(async (doc) => {
        const { totalDocs } = await payload.count({
          collection: 'posts',
          locale,
          where: { and: [...liveIn(), { category: { equals: doc.id } }] },
        })
        return { ...(mapCategory(doc) as Category), postCount: totalDocs }
      }),
    )
    return withCounts.filter((category) => category.postCount > 0)
  }

  async categoryBySlug(slug: string, locale: Locale): Promise<Category | null> {
    const payload = await this.getPayload()
    const { docs } = await payload.find({
      collection: 'categories',
      locale,
      fallbackLocale: FALLBACK_LOCALE,
      depth: 0,
      limit: 1,
      where: { slug: { equals: slug } },
    })
    return mapCategory(docs[0])
  }

  async categoryPaths(categoryId: number): Promise<LocalePaths> {
    const payload = await this.getPayload()
    const doc = await payload.findByID({
      collection: 'categories',
      id: categoryId,
      locale: 'all',
      depth: 0,
      select: { slug: true },
    })
    const slugs = readLocalized(doc.slug)
    const paths = await Promise.all(
      (Object.entries(slugs) as [Locale, string][]).map(async ([locale, slug]) => {
        const { totalDocs } = await payload.count({
          collection: 'posts',
          locale,
          where: { and: [...liveIn(), { category: { equals: categoryId } }] },
        })
        return totalDocs > 0 ? ([locale, localizedPath(locale, `/blog/category/${slug}`)] as const) : null
      }),
    )
    return Object.fromEntries(paths.filter((entry) => entry !== null))
  }

  async authorBySlug(slug: string, locale: Locale): Promise<Author | null> {
    const payload = await this.getPayload()
    const { docs } = await payload.find({
      collection: 'authors',
      locale,
      fallbackLocale: FALLBACK_LOCALE,
      depth: 1,
      limit: 1,
      where: { slug: { equals: slug } },
    })
    return docs[0] ? mapAuthor(docs[0]) : null
  }
}

export class PayloadRedirectReader implements RedirectReader {
  constructor(private readonly getPayload: GetPayload) {}

  async find(path: string): Promise<string | null> {
    const payload = await this.getPayload()
    const { docs } = await payload.find({
      collection: 'redirects',
      depth: 1,
      limit: 1,
      where: { from: { equals: path } },
    })
    const to = docs[0]?.to
    if (!to) return null
    if (to.type === 'custom') return to.url ?? null
    const reference = to.reference?.value
    return reference && typeof reference === 'object' && 'slug' in reference ? `/blog/${reference.slug}` : null
  }
}
