import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'

import { canPublish } from '@/access/roles'

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** What is waiting for an editor, right on the dashboard. It works with or without email set up. */
export const ReviewQueue = async ({ payload, user }: AdminViewServerProps) => {
  if (!canPublish(user as { role?: 'admin' | 'editor' | 'author' } | null)) return null

  const { docs, totalDocs } = await payload.find({
    collection: 'posts',
    draft: true,
    depth: 0,
    limit: 10,
    locale: 'fr',
    sort: '-updatedAt',
    overrideAccess: true,
    where: { reviewStatus: { equals: 'in_review' } },
  })

  return (
    <section className="review-queue">
      <h2>À relire {totalDocs > 0 && <span className="review-queue__count">{totalDocs}</span>}</h2>
      {docs.length === 0 ? (
        <p>Aucun article n’attend de relecture.</p>
      ) : (
        <ul>
          {docs.map((post) => (
            <li key={post.id}>
              <Link href={`/admin/collections/posts/${post.id}`}>{post.title || 'Sans titre'}</Link>
              <time dateTime={post.updatedAt}>{dateFormat.format(new Date(post.updatedAt))}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
