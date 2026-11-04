import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { CategoryPill } from '@/components/blog/CategoryPill'
import { JsonLd } from '@/components/blog/JsonLd'
import { MediaFrame, Picture } from '@/components/blog/MediaFrame'
import { PageShell } from '@/components/blog/PageShell'
import { PostCard } from '@/components/blog/PostCard'
import { RichText } from '@/components/blog/RichText'
import { ShareLinks } from '@/components/blog/ShareLinks'
import { Toc } from '@/components/blog/Toc'
import type { Locale, PostDetail } from '@/domain/types'
import { Link } from '@/i18n/navigation'
import { postReader, redirectReader } from '@/infrastructure/container'
import { formatDate, formatEntry } from '@/lib/format'
import { extractHeadings } from '@/lib/lexical'
import { siteUrl } from '@/lib/site'
import { localizedPath } from '@/seo/hreflang'
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from '@/seo/jsonld'
import { articleMetadata } from '@/seo/metadata'

export const revalidate = 3600
export const generateStaticParams = () => []

type Props = { params: Promise<{ locale: Locale; slug: string }> }

const loadPost = async (locale: Locale, rawSlug: string): Promise<PostDetail | null> => {
  const { isEnabled: draft } = await draftMode()
  return postReader.findBySlug(decodeURIComponent(rawSlug), locale, draft)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const post = await loadPost(locale, slug)
  return post ? articleMetadata(post, locale) : {}
}

const relatedPosts = async (post: PostDetail, locale: Locale) => {
  if (post.related.length) return post.related.slice(0, 3)
  const sameTopic = post.category
    ? await postReader.list({ locale, categoryId: post.category.id, excludeIds: [post.id], limit: 3 })
    : null
  if (sameTopic && sameTopic.items.length === 3) return sameTopic.items
  const latest = await postReader.list({ locale, excludeIds: [post.id], limit: 3 })
  const seen = new Set((sameTopic?.items ?? []).map((item) => item.id))
  return [...(sameTopic?.items ?? []), ...latest.items.filter((item) => !seen.has(item.id))].slice(0, 3)
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const post = await loadPost(locale, slug)
  if (!post) {
    const decoded = decodeURIComponent(slug)
    const target = await redirectReader.find(localizedPath(locale, `/blog/${decoded}`))
    if (target) permanentRedirect(encodeURI(target))
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'article' })
  const tBlog = await getTranslations({ locale, namespace: 'blog' })
  const headings = extractHeadings(post.body)
  const related = await relatedPosts(post, locale)
  const author = post.authors[0]
  const url = `${siteUrl()}${encodeURI(localizedPath(locale, `/blog/${post.slug}`))}`
  const faq = faqJsonLd(post)
  const wasUpdated = new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > 86_400_000

  return (
    <PageShell locale={locale} paths={post.alternates}>
      <JsonLd data={articleJsonLd(post, locale)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: tBlog('title'), path: localizedPath(locale, '/blog') },
          ...(post.category
            ? [{ name: post.category.name, path: localizedPath(locale, `/blog/category/${post.category.slug}`) }]
            : []),
          { name: post.title, path: localizedPath(locale, `/blog/${post.slug}`) },
        ])}
      />
      {faq && <JsonLd data={faq} />}
      <div className="read-progress" aria-hidden="true" />

      <article>
        <header className="container article-head">
          <nav className="crumbs" aria-label="breadcrumb">
            <Link href="/blog" locale={locale}>
              {tBlog('title')}
            </Link>
            {post.category && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/blog/category/${post.category.slug}`} locale={locale}>
                  {post.category.name}
                </Link>
              </>
            )}
          </nav>
          <div className="article-head__tags">
            <CategoryPill category={post.category} />
            <span className="mono article-head__entry">{tBlog('entry', { number: formatEntry(post.entryNumber) })}</span>
          </div>
          <h1 className="article-title">{post.title}</h1>
          <p className="article-standfirst">{post.excerpt}</p>
          <div className="article-byline">
            {author && (
              <Link href={`/blog/author/${author.slug}`} locale={locale} className="byline">
                {author.avatar ? (
                  <Picture asset={author.avatar} sizes="40px" className="byline__avatar" />
                ) : (
                  <span className="byline__avatar byline__avatar--initials" aria-hidden="true">
                    {author.name.slice(0, 1)}
                  </span>
                )}
                <span className="byline__name">{author.name}</span>
              </Link>
            )}
            <p className="mono article-byline__meta">
              <span>{t('publishedOn', { date: formatDate(post.publishedAt, locale) })}</span>
              {wasUpdated && <span>{t('updatedOn', { date: formatDate(post.updatedAt, locale) })}</span>}
              <span>{tBlog('minutes', { count: post.readingMinutes })}</span>
            </p>
          </div>
        </header>

        {post.hero && (
          <div className="container">
            <MediaFrame
              asset={post.hero}
              sizes="(max-width: 1200px) 100vw, 1152px"
              priority
              interactive={false}
              className="media--cover"
            />
          </div>
        )}

        <div className="container article-layout">
          <Toc headings={headings} title={t('contents')} />
          <div className="article-main">
            <RichText data={post.body} locale={locale} />

            <footer className="article-foot">
              <ShareLinks
                url={url}
                title={post.title}
                labels={{ share: t('share'), copy: t('copyLink'), copied: t('copied') }}
              />
              {author && (
                <div className="author-card">
                  {author.avatar ? (
                    <Picture asset={author.avatar} sizes="56px" className="author-card__avatar" />
                  ) : (
                    <span className="author-card__avatar byline__avatar--initials" aria-hidden="true">
                      {author.name.slice(0, 1)}
                    </span>
                  )}
                  <div>
                    <p className="author-card__label">{t('writtenBy')}</p>
                    <Link href={`/blog/author/${author.slug}`} locale={locale} className="author-card__name">
                      {author.name}
                    </Link>
                    {author.jobTitle && <p className="author-card__role">{author.jobTitle}</p>}
                    {author.bio && <p className="author-card__bio">{author.bio}</p>}
                  </div>
                </div>
              )}
            </footer>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="container section">
          <h2 className="section__title">{t('readAlso')}</h2>
          <div className="card-grid card-grid--spaced">
            {related.map((item) => (
              <PostCard key={item.id} post={item} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  )
}
