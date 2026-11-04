import { getTranslations } from 'next-intl/server'

import type { CategoryWithCount, Locale, Paginated, PostSummary } from '@/domain/types'
import { Link } from '@/i18n/navigation'
import { formatCount, formatDate, formatEntry } from '@/lib/format'

import { CategoryPill } from './CategoryPill'
import { ArrowIcon } from './icons'

/** The blog's signature: every post is an entry in a ledger, with hairline rules and tabular figures. */
export const Register = async ({ posts, locale }: { posts: PostSummary[]; locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'blog' })
  return (
    <div className="register">
      <div className="register__head" aria-hidden="true">
        <span>{t('colEntry')}</span>
        <span>{t('colTitle')}</span>
        <span>{t('colTopic')}</span>
        <span>{t('colDate')}</span>
        <span className="register__cell-end">{t('colRead')}</span>
        <span />
      </div>
      <ol className="register__list">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} locale={locale} className="register__row">
              <span className="register__entry mono">{formatEntry(post.entryNumber)}</span>
              <span className="register__title">{post.title}</span>
              <span className="register__topic">
                <CategoryPill category={post.category} />
              </span>
              <time className="register__date mono" dateTime={post.publishedAt}>
                {formatDate(post.publishedAt, locale)}
              </time>
              <span className="register__read mono">{t('minutes', { count: post.readingMinutes })}</span>
              <ArrowIcon className="register__arrow" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

type TopicChipsProps = {
  categories: CategoryWithCount[]
  locale: Locale
  total: number
  activeId?: number
}

export const TopicChips = async ({ categories, locale, total, activeId }: TopicChipsProps) => {
  const t = await getTranslations({ locale, namespace: 'blog' })
  return (
    <nav className="chips" aria-label={t('topics')}>
      <Link href="/blog#registre" locale={locale} className={`chip ${activeId ? '' : 'is-active'}`}>
        {t('allTopics')} <span className="chip__count mono">{formatCount(total)}</span>
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/blog/category/${category.slug}`}
          locale={locale}
          className={`chip ${activeId === category.id ? 'is-active' : ''}`}
        >
          {category.name} <span className="chip__count mono">{formatCount(category.postCount)}</span>
        </Link>
      ))}
    </nav>
  )
}

type PaginationProps = {
  result: Paginated<PostSummary>
  locale: Locale
  basePath: string
}

export const Pagination = async ({ result, locale, basePath }: PaginationProps) => {
  const t = await getTranslations({ locale, namespace: 'blog' })
  if (result.totalPages <= 1) return null
  const href = (page: number) => (page === 1 ? basePath : `${basePath}/page/${page}`)
  return (
    <nav className="pagination" aria-label={t('pageOf', { page: result.page, total: result.totalPages })}>
      {result.page > 1 ? (
        <Link href={href(result.page - 1)} locale={locale} className="btn btn--secondary" rel="prev">
          {t('previous')}
        </Link>
      ) : (
        <span />
      )}
      <span className="mono pagination__status">{t('pageOf', { page: result.page, total: result.totalPages })}</span>
      {result.page < result.totalPages ? (
        <Link href={href(result.page + 1)} locale={locale} className="btn btn--secondary" rel="next">
          {t('next')}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
