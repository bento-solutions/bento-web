/**
 * Fills a local database with sample content. Development only: it wipes the blog first.
 *   npm run seed
 *   SEED_TRANSLATIONS=1 npm run seed   adds an English and Arabic version of one post
 */
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { fileURLToPath } from 'url'

import { slugify } from '../src/lib/slugify'
import config from '../src/payload.config'
import { sampleCategories, sampleCovers, samplePosts, sampleTranslations } from '../seed/content'

const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../seed/assets')
const context = { disableRevalidate: true }

const wipe = async (payload: Payload) => {
  for (const collection of ['redirects', 'posts', 'authors', 'categories', 'media', 'users'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } }, context })
  }
}

const seedUsers = async (payload: Payload) => {
  const password = process.env.SEED_PASSWORD
  if (!password) throw new Error('SEED_PASSWORD is missing. See .env.example.')
  const accounts = [
    { email: process.env.SEED_ADMIN_EMAIL, name: 'Admin', role: 'admin' as const },
    { email: process.env.SEED_EDITOR_EMAIL, name: 'Éditeur', role: 'editor' as const },
    { email: process.env.SEED_AUTHOR_EMAIL, name: 'Auteur', role: 'author' as const },
  ]
  for (const account of accounts) {
    if (account.email) await payload.create({ collection: 'users', data: { ...account, email: account.email, password } })
  }
}

const seedCovers = async (payload: Payload) => {
  const ids: Record<string, number> = {}
  for (const cover of sampleCovers) {
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

const seedCategories = async (payload: Payload) => {
  const ids: Record<string, number> = {}
  for (const category of sampleCategories) {
    const doc = await payload.create({
      collection: 'categories',
      locale: 'fr',
      data: {
        name: category.fr,
        slug: slugify(category.fr),
        description: category.description,
        tone: category.tone as never,
        displayOrder: category.order,
      } as never,
      context,
    })
    for (const locale of ['en', 'ar'] as const) {
      await payload.update({
        collection: 'categories',
        id: doc.id,
        locale,
        data: { name: category[locale], slug: slugify(category[locale]), generateSlug: false },
        context,
      })
    }
    ids[category.key] = doc.id
  }
  return ids
}

const run = async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('The seed wipes the blog. It never runs in production.')

  const payload = await getPayload({ config })
  await wipe(payload)
  await seedUsers(payload)

  const covers = await seedCovers(payload)
  const categories = await seedCategories(payload)
  const author = await payload.create({
    collection: 'authors',
    locale: 'fr',
    data: {
      name: 'La rédaction Bento',
      slug: slugify('La rédaction Bento'),
      jobTitle: 'Bento Solutions, Casablanca',
      bio: 'Nous aidons les entreprises marocaines à remplacer leurs tableurs par un seul système. Ce carnet rassemble ce que nous apprenons sur le terrain.',
    } as never,
    context,
  })

  const ids: Record<string, number> = {}
  for (const post of samplePosts) {
    const created = await payload.create({
      collection: 'posts',
      locale: 'fr',
      draft: false,
      context,
      data: {
        _status: 'published',
        title: post.title,
        slug: slugify(post.title),
        excerpt: post.excerpt,
        hero: covers[post.cover],
        body: post.body as never,
        category: categories[post.category],
        authors: [author.id],
        publishedAt: post.publishedAt,
        featured: 'featured' in post ? post.featured : false,
        targetKeyword: post.targetKeyword,
        meta: { title: post.title, description: post.metaDescription },
      } as never,
    })
    ids[post.key] = created.id
  }

  if (process.env.SEED_TRANSLATIONS === '1') {
    for (const [key, locales] of Object.entries(sampleTranslations)) {
      for (const [locale, translation] of Object.entries(locales) as ['en' | 'ar', (typeof locales)['en']][]) {
        await payload.update({
          collection: 'posts',
          id: ids[key],
          locale,
          draft: false,
          context,
          data: {
            _status: 'published',
            title: translation.title,
            slug: slugify(translation.title),
            generateSlug: false,
            excerpt: translation.excerpt,
            body: translation.body as never,
            meta: { title: translation.title, description: translation.metaDescription },
          },
        })
      }
    }
  }

  payload.logger.info(`Seeded ${samplePosts.length} posts.`)
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await run().catch((err) => {
  console.error(err, JSON.stringify(err?.data?.errors ?? null))
  process.exit(1)
})
