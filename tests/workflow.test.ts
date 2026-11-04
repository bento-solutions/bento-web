import { Client } from 'pg'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

/** The editorial rules, exercised through Payload with access control on, as the admin does. */
let payload: Payload
let admin: User
let editor: User
let author: User
let otherAuthor: User
let categoryId: number
let bylineId: number
let mediaId: number

const context = { disableRevalidate: true }
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

const body = {
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        children: [{ type: 'text', version: 1, text: 'Un paragraphe.', format: 0, detail: 0, mode: 'normal', style: '' }],
      },
    ],
  },
}

const completePost = (title: string) => ({
  title,
  slug: title.toLowerCase().replace(/\s+/g, '-'),
  excerpt: 'Un chapô.',
  hero: mediaId,
  body,
  category: categoryId,
  authors: [bylineId],
  meta: { description: 'Une description assez longue pour Google, qui dépasse bien les cinquante caractères.' },
})

const createDraft = (user: User, title: string, extra: object = {}) =>
  payload.create({
    collection: 'posts',
    draft: true,
    locale: 'fr',
    overrideAccess: false,
    user,
    context,
    data: { ...completePost(title), _status: 'draft', ...extra } as never,
  })

const update = (user: User, id: number, data: object) =>
  payload.update({
    collection: 'posts',
    id,
    locale: 'fr',
    draft: (data as { _status?: string })._status !== 'published',
    overrideAccess: false,
    user,
    context,
    data: data as never,
  })

const createUser = async (role: User['role'], email: string): Promise<User> =>
  (await payload.create({
    collection: 'users',
    data: { name: role, email, password: 'test-password', role },
    context,
  })) as User

beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL as string)
  const database = url.pathname.slice(1)
  url.pathname = '/postgres'
  const client = new Client({ connectionString: url.toString() })
  await client.connect()
  await client.query(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`)
  await client.query(`CREATE DATABASE ${database}`)
  await client.end()

  const { default: config } = await import('@/payload.config')
  payload = await getPayload({ config })

  admin = await createUser('admin', 'admin@test.local')
  editor = await createUser('editor', 'editor@test.local')
  author = await createUser('author', 'author@test.local')
  otherAuthor = await createUser('author', 'other@test.local')

  categoryId = (
    await payload.create({ collection: 'categories', data: { name: 'Test', slug: 'test', tone: 'teal' }, context })
  ).id
  bylineId = (
    await payload.create({ collection: 'authors', data: { name: 'Test', slug: 'test' } as never, context })
  ).id
  mediaId = (
    await payload.create({
      collection: 'media',
      data: { alt: 'Test' },
      file: { data: png, mimetype: 'image/png', name: 'test.png', size: png.length },
      context,
    })
  ).id
})

afterAll(async () => {
  await payload?.destroy()
})

describe('accounts', () => {
  it('makes the very first account an admin', () => {
    expect(admin.role).toBe('admin')
  })

  it('stops anyone but an admin from changing a role', async () => {
    const after = await payload.update({
      collection: 'users',
      id: author.id,
      overrideAccess: false,
      user: author,
      data: { role: 'admin' },
      context,
    })
    expect(after.role).toBe('author')
  })

  it('keeps accounts private from other authors', async () => {
    const { docs } = await payload.find({ collection: 'users', overrideAccess: false, user: author })
    expect(docs.map((doc) => doc.id)).toEqual([author.id])
  })
})

describe('authors', () => {
  it('can write a draft, which records who wrote it', async () => {
    const post = await createDraft(author, 'Brouillon auteur')
    expect(post._status).toBe('draft')
    expect(post.reviewStatus).toBe('draft')
    expect(typeof post.createdBy === 'object' ? post.createdBy?.id : post.createdBy).toBe(author.id)
  })

  it('cannot publish when creating a post', async () => {
    await expect(
      payload.create({
        collection: 'posts',
        locale: 'fr',
        overrideAccess: false,
        user: author,
        context,
        data: { ...completePost('Auteur publie'), _status: 'published' } as never,
      }),
    ).rejects.toThrow(/éditeurs peuvent publier/)
  })

  it('cannot publish an existing draft', async () => {
    const post = await createDraft(author, 'Auteur publie plus tard')
    await expect(update(author, post.id, { _status: 'published' })).rejects.toThrow(/éditeurs peuvent publier/)
  })

  it('cannot approve their own post', async () => {
    const post = await createDraft(author, 'Auteur approuve')
    await expect(update(author, post.id, { reviewStatus: 'approved' })).rejects.toThrow()
  })

  it('cannot touch or even see a colleague’s draft', async () => {
    const post = await createDraft(otherAuthor, 'Brouillon du collègue')
    await expect(update(author, post.id, { title: 'Volé' })).rejects.toThrow()
    const { docs } = await payload.find({
      collection: 'posts',
      draft: true,
      overrideAccess: false,
      user: author,
      where: { id: { equals: post.id } },
    })
    expect(docs).toHaveLength(0)
  })
})

describe('review', () => {
  it('refuses an incomplete post and names what is missing', async () => {
    const post = await createDraft(author, 'Incomplet', { meta: { description: 'Trop court' } })
    await expect(update(author, post.id, { reviewStatus: 'in_review' })).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: 'meta.description' })] },
    })
  })

  it('accepts a complete post', async () => {
    const post = await createDraft(author, 'Complet')
    const after = await update(author, post.id, { reviewStatus: 'in_review' })
    expect(after.reviewStatus).toBe('in_review')
  })

  it('sends an approved post back to draft when its author changes it', async () => {
    const post = await createDraft(author, 'Approuvé puis modifié')
    await update(editor, post.id, { reviewStatus: 'approved' })
    const after = await update(author, post.id, { title: 'Approuvé puis modifié v2' })
    expect(after.reviewStatus).toBe('draft')
  })
})

describe('publishing', () => {
  it('lets editors publish, and gives the post a date and a ledger number that never change', async () => {
    const post = await createDraft(author, 'Publié par éditeur')
    const published = await update(editor, post.id, { _status: 'published' })
    expect(published._status).toBe('published')
    expect(published.reviewStatus).toBe('approved')
    expect(published.publishedAt).toBeTruthy()
    expect(published.entryNumber).toBeGreaterThan(0)

    const next = await update(editor, (await createDraft(author, 'Le suivant')).id, { _status: 'published' })
    expect(next.entryNumber).toBe((published.entryNumber as number) + 1)

    const again = await update(editor, post.id, { _status: 'published', title: 'Publié, corrigé' })
    expect(again.entryNumber).toBe(published.entryNumber)
    expect(again.publishedAt).toBe(published.publishedAt)
  })

  it('hides drafts from visitors and internal notes from everyone logged out', async () => {
    const hidden = await createDraft(author, 'Encore caché')
    const live = await update(editor, (await createDraft(author, 'Déjà public', { targetKeyword: 'secret' })).id, {
      _status: 'published',
    })

    const { docs } = await payload.find({ collection: 'posts', overrideAccess: false, limit: 100 })
    const ids = docs.map((doc) => doc.id)
    expect(ids).toContain(live.id)
    expect(ids).not.toContain(hidden.id)
    expect(docs.find((doc) => doc.id === live.id)?.targetKeyword).toBeUndefined()
  })

  it('leaves a redirect behind when a published slug changes', async () => {
    const post = await update(editor, (await createDraft(author, 'Ancien titre')).id, { _status: 'published' })
    await update(editor, post.id, { _status: 'published', slug: 'nouveau-titre', generateSlug: false })
    const { docs } = await payload.find({ collection: 'redirects', where: { from: { equals: `/blog/${post.slug}` } } })
    expect(docs[0]?.to?.url).toBe('/blog/nouveau-titre')
  })

  it('treats a language as live only once it is really translated', async () => {
    const { PayloadPostReader } = await import('@/infrastructure/payload-readers')
    const reader = new PayloadPostReader(async () => payload)
    const isLiveInEnglish = async (id: number) => (await reader.list({ locale: 'en', limit: 100 })).items.some((item) => item.id === id)

    const post = await update(editor, (await createDraft(author, 'Seulement en français')).id, { _status: 'published' })
    expect(await isLiveInEnglish(post.id)).toBe(false)

    // A translator saves a title, then an editor publishes a correction to the French version.
    await payload.update({
      collection: 'posts',
      id: post.id,
      locale: 'en',
      draft: true,
      context,
      data: { title: 'Half translated', slug: 'half-translated', generateSlug: false } as never,
    })
    await update(editor, post.id, { _status: 'published', excerpt: 'Un chapô corrigé.' })
    expect(await isLiveInEnglish(post.id)).toBe(false)
    expect((await reader.findBySlug(post.slug, 'fr', false))?.alternates).toEqual({ fr: `/blog/${post.slug}` })

    await payload.update({
      collection: 'posts',
      id: post.id,
      locale: 'en',
      draft: false,
      context,
      data: { _status: 'published', title: 'Translated', slug: 'translated', generateSlug: false, excerpt: 'A standfirst.', body } as never,
    })
    expect(await isLiveInEnglish(post.id)).toBe(true)
    expect((await reader.findBySlug(post.slug, 'fr', false))?.alternates).toEqual({
      fr: `/blog/${post.slug}`,
      en: '/en/blog/translated',
    })
    expect(await reader.liveLocales()).toEqual(expect.arrayContaining(['fr', 'en']))
  })
})
