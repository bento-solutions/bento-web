import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { PostReader, RedirectReader, TaxonomyReader } from '../domain/ports'
import { PayloadPostReader, PayloadRedirectReader, PayloadTaxonomyReader } from './payload-readers'

/** Composition root: the one place that knows the public pages are backed by Payload. */
const client = () => getPayload({ config })

const posts = new PayloadPostReader(client)
const taxonomy = new PayloadTaxonomyReader(client)
const redirects = new PayloadRedirectReader(client)

// `cache` dedupes calls made by generateMetadata and the page during a single render.
export const postReader: PostReader = {
  findBySlug: cache((slug, locale, draft) => posts.findBySlug(slug, locale, draft)),
  list: (query) => posts.list(query),
  featured: cache((locale) => posts.featured(locale)),
  liveLocales: cache(() => posts.liveLocales()),
  sitemapEntries: () => posts.sitemapEntries(),
}

export const taxonomyReader: TaxonomyReader = {
  categories: cache((locale) => taxonomy.categories(locale)),
  categoryBySlug: cache((slug, locale) => taxonomy.categoryBySlug(slug, locale)),
  categoryPaths: cache((id) => taxonomy.categoryPaths(id)),
  authorBySlug: cache((slug, locale) => taxonomy.authorBySlug(slug, locale)),
}

export const redirectReader: RedirectReader = redirects
