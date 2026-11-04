import { getTranslations } from 'next-intl/server'

import type { Locale, PostSummary } from '@/domain/types'
import { Link } from '@/i18n/navigation'
import { formatDate, formatEntry } from '@/lib/format'

import { CategoryPill } from './CategoryPill'
import { ArrowIcon } from './icons'
import { MediaFrame } from './MediaFrame'

export const PostCard = async ({ post, locale }: { post: PostSummary; locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'blog' })
  return (
    <article className="card">
      <Link href={`/blog/${post.slug}`} locale={locale} className="card__link">
        <MediaFrame
          asset={post.hero}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 384px"
          className="media--card"
        />
        <div className="card__head">
          <h3 className="card__title">{post.title}</h3>
          <CategoryPill category={post.category} />
        </div>
        <p className="card__meta mono">
          <span>{t('entry', { number: formatEntry(post.entryNumber) })}</span>
          <span>{formatDate(post.publishedAt, locale)}</span>
          <span>{t('minutes', { count: post.readingMinutes })}</span>
        </p>
      </Link>
    </article>
  )
}

export const FeaturedPost = async ({ post, locale }: { post: PostSummary; locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'blog' })
  return (
    <article className="featured">
      <Link href={`/blog/${post.slug}`} locale={locale} className="featured__link">
        <MediaFrame
          asset={post.hero}
          sizes="(max-width: 1024px) 100vw, 600px"
          priority
          className="media--featured"
        />
        <div className="featured__body">
          <span className="pill pill--inverse">{t('mustRead')}</span>
          <h2 className="featured__title">{post.title}</h2>
          <p className="featured__excerpt">{post.excerpt}</p>
          <p className="featured__read mono">
            <span>{t('entry', { number: formatEntry(post.entryNumber) })}</span>
            <span>{formatDate(post.publishedAt, locale)}</span>
            <span>{t('minutes', { count: post.readingMinutes })}</span>
          </p>
          <div className="featured__foot">
            <span className="featured__author">
              {post.authors[0] ? t('by', { name: post.authors[0].name }) : null}
            </span>
            <CategoryPill category={post.category} />
            <ArrowIcon size={20} className="featured__arrow" />
          </div>
        </div>
      </Link>
    </article>
  )
}
