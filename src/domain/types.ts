import type { LexicalDocument } from '../lib/lexical'

export type Locale = 'fr' | 'en' | 'ar'

export type ImageAsset = {
  kind: 'image'
  url: string
  /** Largest generated size that still suits a poster or social card. */
  largeUrl: string
  alt: string
  width: number
  height: number
  srcSet: string
  focal: { x: number; y: number } | null
}

export type VideoAsset = {
  kind: 'video'
  url: string
  mimeType: string
  alt: string
  poster: ImageAsset | null
}

export type MediaAsset = ImageAsset | VideoAsset

export type CategoryTone = 'teal' | 'copper' | 'green' | 'violet' | 'ochre' | 'clay' | 'graphite'

export type Category = {
  id: number
  slug: string
  name: string
  description: string | null
  tone: CategoryTone
}

export type CategoryWithCount = Category & { postCount: number }

export type Author = {
  id: number
  slug: string
  name: string
  jobTitle: string | null
  bio: string | null
  avatar: ImageAsset | null
  linkedin: string | null
}

export type PostSummary = {
  id: number
  entryNumber: number | null
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  updatedAt: string
  readingMinutes: number
  featured: boolean
  category: Category | null
  authors: Author[]
  hero: MediaAsset | null
}

/** Paths per language, for language links and hreflang. Only languages that really exist are present. */
export type LocalePaths = Partial<Record<Locale, string>>

export type PostDetail = PostSummary & {
  body: LexicalDocument
  metaTitle: string | null
  metaDescription: string | null
  metaImage: ImageAsset | null
  noindex: boolean
  canonicalUrl: string | null
  alternates: LocalePaths
  related: PostSummary[]
}

export type Paginated<T> = {
  items: T[]
  page: number
  totalPages: number
  total: number
}

export type SitemapEntry = {
  paths: LocalePaths
  lastModified: string
}
