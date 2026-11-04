import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  ValidationError,
} from 'payload'

import { allowedReviewStatuses, canPublish, type ReviewStatus } from '../access/roles'
import { type LexicalDocument, readingMinutes } from '../lib/lexical'

const META_DESCRIPTION_MIN = 50
const META_DESCRIPTION_MAX = 160

type PostData = {
  title?: string | null
  excerpt?: string | null
  hero?: unknown
  category?: unknown
  authors?: unknown[] | null
  body?: unknown
  reviewStatus?: ReviewStatus | null
  meta?: { description?: string | null } | null
  _status?: 'draft' | 'published' | null
}

/** What must be filled in before a post goes to an editor. Returned as field errors for the admin form. */
export const missingForReview = (post: PostData): { path: string; message: string }[] => {
  const errors: { path: string; message: string }[] = []
  if (!post.title) errors.push({ path: 'title', message: 'Ajoutez un titre.' })
  if (!post.excerpt) errors.push({ path: 'excerpt', message: 'Ajoutez un chapô.' })
  if (!post.hero) errors.push({ path: 'hero', message: 'Ajoutez une image ou une vidéo de couverture.' })
  if (!post.body) errors.push({ path: 'body', message: 'L’article est vide.' })
  if (!post.category) errors.push({ path: 'category', message: 'Choisissez un thème.' })
  if (!post.authors?.length) errors.push({ path: 'authors', message: 'Choisissez une signature.' })
  const description = post.meta?.description ?? ''
  if (description.length < META_DESCRIPTION_MIN || description.length > META_DESCRIPTION_MAX) {
    errors.push({
      path: 'meta.description',
      message: `La description Google doit faire entre ${META_DESCRIPTION_MIN} et ${META_DESCRIPTION_MAX} caractères (actuellement ${description.length}).`,
    })
  }
  return errors
}

/**
 * Keeps the editorial rules on the server, where they cannot be bypassed from the browser:
 * authors never publish or approve, and a post only reaches review when it is complete.
 * Requests without a user are trusted system calls (seed, scheduled publishing).
 */
export const enforceWorkflow: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const user = req.user
  if (!user) return data

  const merged: PostData = { ...originalDoc, ...data }
  const previous = originalDoc?.reviewStatus as ReviewStatus | undefined

  if (data._status === 'published' && !canPublish(user)) {
    throw new APIError('Seuls les éditeurs peuvent publier un article.', 403, null, true)
  }

  const requested = data.reviewStatus as ReviewStatus | undefined
  if (requested && requested !== previous && !allowedReviewStatuses(user).includes(requested)) {
    throw new APIError('Seuls les éditeurs peuvent approuver un article.', 403, null, true)
  }

  if (requested === 'in_review' && previous !== 'in_review') {
    const errors = missingForReview(merged)
    if (errors.length) {
      throw new ValidationError({ collection: 'posts', errors, req })
    }
  }

  // An author's change to an approved post has to be looked at again.
  if (!canPublish(user) && previous === 'approved' && (requested === 'approved' || !requested)) {
    return { ...data, reviewStatus: 'draft' }
  }

  return data
}

/** Fields nobody should have to think about: ownership, dates, ledger number, reading time. */
export const fillComputedFields: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  const next = { ...data }

  if (operation === 'create' && req.user) next.createdBy = req.user.id

  if (data.body) next.readingMinutes = readingMinutes(data.body as LexicalDocument)

  if (data._status === 'published') {
    next.reviewStatus = 'approved'
    if (!data.publishedAt && !originalDoc?.publishedAt) next.publishedAt = new Date().toISOString()
    // Every post gets a ledger number the first time it goes live, and keeps it for good.
    if (!originalDoc?.entryNumber) {
      const { docs } = await req.payload.find({
        collection: 'posts',
        sort: '-entryNumber',
        where: { entryNumber: { exists: true } },
        limit: 1,
        depth: 0,
        req,
        select: { entryNumber: true },
      })
      next.entryNumber = ((docs[0]?.entryNumber as number | undefined) ?? 0) + 1
    }
  }

  return next
}

export const notifyEditorsOnReview: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (doc.reviewStatus !== 'in_review' || previousDoc?.reviewStatus === 'in_review') return doc
  try {
    const { docs: editors } = await req.payload.find({
      collection: 'users',
      where: { role: { in: ['editor', 'admin'] } },
      limit: 50,
      depth: 0,
      req,
    })
    const to = editors.map((editor) => editor.email).filter(Boolean)
    if (to.length) {
      const adminUrl = `${process.env.CMS_URL || ''}/admin/collections/posts/${doc.id}`
      await req.payload.sendEmail({
        to,
        subject: `À relire : ${doc.title}`,
        html: `<p>Un article attend votre relecture sur Le carnet Bento.</p><p><strong>${doc.title}</strong></p><p><a href="${adminUrl}">Ouvrir l’article</a></p>`,
      })
    }
  } catch (err) {
    // A mail problem must never stop someone from saving their work.
    req.payload.logger.error({ err }, 'Could not notify editors about a post in review')
  }
  return doc
}

/** A published URL must keep working: changing a slug leaves a permanent redirect behind. */
export const redirectChangedSlugs: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const previousSlug = previousDoc?.slug
  if (doc._status !== 'published' || previousDoc?._status !== 'published') return doc
  if (!previousSlug || !doc.slug || previousSlug === doc.slug) return doc
  const locale = req.locale && req.locale !== 'fr' ? `/${req.locale}` : ''
  try {
    await req.payload.create({
      collection: 'redirects',
      data: {
        from: `${locale}/blog/${previousSlug}`,
        to: { type: 'custom', url: `${locale}/blog/${doc.slug}` },
        type: '301',
      },
      req,
    })
  } catch (err) {
    req.payload.logger.error({ err }, 'Could not create a redirect for a changed slug')
  }
  return doc
}
