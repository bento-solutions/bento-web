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
} from './types'

export type PostQuery = {
  locale: Locale
  page?: number
  limit?: number
  categoryId?: number
  authorId?: number
  excludeIds?: number[]
}

/** What the public pages need to read. They never see Payload itself. */
export interface PostReader {
  findBySlug(slug: string, locale: Locale, draft: boolean): Promise<PostDetail | null>
  list(query: PostQuery): Promise<Paginated<PostSummary>>
  featured(locale: Locale): Promise<PostSummary | null>
  /** Languages with at least one published post. A language only goes public once it has content. */
  liveLocales(): Promise<Locale[]>
  sitemapEntries(): Promise<SitemapEntry[]>
}

export interface TaxonomyReader {
  categories(locale: Locale): Promise<CategoryWithCount[]>
  categoryBySlug(slug: string, locale: Locale): Promise<Category | null>
  categoryPaths(categoryId: number): Promise<LocalePaths>
  authorBySlug(slug: string, locale: Locale): Promise<Author | null>
}

export interface RedirectReader {
  find(path: string): Promise<string | null>
}
