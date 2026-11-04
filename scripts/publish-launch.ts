/**
 * Loads the launch articles into an empty production blog. Safe to run twice: anything already there
 * is left alone, and nothing is ever deleted.
 *   npm run publish:launch
 *
 * Articles marked `hold` go in as drafts waiting for review. The others are published with today's
 * date, oldest first, so the ledger numbers follow the order on the page.
 */
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { fileURLToPath } from 'url'

import { slugify } from '../src/lib/slugify'
import config from '../src/payload.config'
import { sampleCategories, sampleCovers, samplePosts } from '../seed/content'

const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../seed/assets')
const context = { disableRevalidate: true }

const findBySlug = async (payload: Payload, collection: 'posts' | 'authors' | 'categories', slug: string) => {
  const { docs } = await payload.find({
    collection,
    locale: 'fr',
    limit: 1,
    depth: 0,
    draft: collection === 'posts',
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
}

const covers = async (payload: Payload) => {
  const ids: Record<string, number> = {}
  for (const cover of sampleCovers) {
    const name = cover.file.replace(/\.[a-z0-9]+$/, '')
    const { docs } = await payload.find({ collection: 'media', depth: 0, limit: 1, where: { filename: { like: `${name}.` } } })
    if (docs[0]) {
      ids[cover.key] = docs[0].id
      continue
    }
    let poster: number | undefined
    if ('poster' in cover) {
      const image = await payload.create({
        collection: 'media',
        data: { alt: cover.alt },
        filePath: path.join(assets, cover.poster),
        locale: 'fr',
        context,
      })
      poster = image.id
    }
    const media = await payload.create({
      collection: 'media',
      data: { alt: cover.alt, poster },
      filePath: path.join(assets, cover.file),
      locale: 'fr',
      context,
    })
    for (const [locale, alt] of [['en', cover.altEn], ['ar', cover.altAr]] as const) {
      await payload.update({ collection: 'media', id: media.id, locale, data: { alt }, context })
    }
    ids[cover.key] = media.id
  }
  return ids
}

const categories = async (payload: Payload) => {
  const ids: Record<string, number> = {}
  for (const category of sampleCategories) {
    const slug = slugify(category.fr)
    const existing = await findBySlug(payload, 'categories', slug)
    if (existing) {
      ids[category.key] = existing.id as number
      continue
    }
    const doc = await payload.create({
      collection: 'categories',
      locale: 'fr',
      context,
      data: { name: category.fr, slug, description: category.description, tone: category.tone, displayOrder: category.order } as never,
    })
    for (const locale of ['en', 'ar'] as const) {
      await payload.update({
        collection: 'categories',
        id: doc.id,
        locale,
        context,
        data: { name: category[locale], slug: slugify(category[locale]), generateSlug: false },
      })
    }
    ids[category.key] = doc.id
  }
  return ids
}

const byline = async (payload: Payload): Promise<number> => {
  const name = 'La rédaction Bento'
  const existing = await findBySlug(payload, 'authors', slugify(name))
  if (existing) return existing.id as number
  const author = await payload.create({
    collection: 'authors',
    locale: 'fr',
    context,
    data: {
      name,
      slug: slugify(name),
      jobTitle: 'Bento Solutions, Casablanca',
      bio: 'Nous aidons les entreprises marocaines à remplacer leurs tableurs par un seul système. Ce carnet rassemble ce que nous apprenons sur le terrain.',
    } as never,
  })
  return author.id
}

const run = async () => {
  const payload = await getPayload({ config })
  const coverIds = await covers(payload)
  const categoryIds = await categories(payload)
  const authorId = await byline(payload)

  const start = Date.now()
  let index = 0
  for (const post of samplePosts) {
    index += 1
    const slug = slugify(post.title)
    if (await findBySlug(payload, 'posts', slug)) {
      payload.logger.info(`Already there, left alone: ${slug}`)
      continue
    }
    const hold = 'hold' in post && post.hold === true
    await payload.create({
      collection: 'posts',
      locale: 'fr',
      draft: hold,
      context,
      data: {
        _status: hold ? 'draft' : 'published',
        reviewStatus: hold ? 'in_review' : 'approved',
        reviewNotes: 'reviewNotes' in post ? post.reviewNotes : undefined,
        aiAssisted: true,
        title: post.title,
        slug,
        excerpt: post.excerpt,
        hero: coverIds[post.cover],
        body: post.body as never,
        category: categoryIds[post.category],
        authors: [authorId],
        publishedAt: hold ? undefined : new Date(start + index * 1000).toISOString(),
        featured: 'featured' in post ? post.featured : false,
        targetKeyword: post.targetKeyword,
        meta: { title: post.title, description: post.metaDescription },
      } as never,
    })
    payload.logger.info(`${hold ? 'In review' : 'Published'}: ${slug}`)
  }
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await run().catch((err) => {
  console.error(err, JSON.stringify(err?.data?.errors ?? null))
  process.exit(1)
})
