import type { MetadataRoute } from 'next'

import type { Locale, LocalePaths } from '@/domain/types'
import { postReader, taxonomyReader } from '@/infrastructure/container'
import { site, siteUrl } from '@/lib/site'
import { localizedPath } from '@/seo/hreflang'

export const dynamic = 'force-dynamic'

const entriesFor = (paths: LocalePaths, lastModified?: string): MetadataRoute.Sitemap => {
  const origin = siteUrl()
  const urls = (Object.entries(paths) as [Locale, string][]).map(
    ([locale, path]) => [locale, `${origin}${encodeURI(path)}`] as const,
  )
  const languages = urls.length > 1 ? Object.fromEntries(urls) : undefined
  return urls.map(([, url]) => ({
    url,
    lastModified,
    alternates: languages ? { languages } : undefined,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, live] = await Promise.all([postReader.sitemapEntries(), postReader.liveLocales()])

  const indexPaths: LocalePaths = Object.fromEntries(live.map((locale) => [locale, localizedPath(locale, '/blog')]))
  // Listed once from French: each category's paths already cover all its languages.
  const categories = await taxonomyReader.categories('fr')
  const categoryEntries = await Promise.all(
    categories.map(async (category) => entriesFor(await taxonomyReader.categoryPaths(category.id))),
  )

  return [
    // The homepage belongs to the brochure app, which has no sitemap of its own.
    { url: site.homeUrl },
    ...entriesFor(indexPaths),
    ...categoryEntries.flat(),
    ...posts.flatMap((post) => entriesFor(post.paths, post.lastModified)),
  ]
}
