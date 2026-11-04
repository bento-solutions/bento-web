import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { JsonLd } from '@/components/blog/JsonLd'
import { blogIndexPaths, PageShell } from '@/components/blog/PageShell'
import { FeaturedPost, PostCard } from '@/components/blog/PostCard'
import { Pagination, Register, TopicChips } from '@/components/blog/Register'
import type { Locale } from '@/domain/types'
import { postReader, taxonomyReader } from '@/infrastructure/container'
import { formatDate } from '@/lib/format'
import { organizationJsonLd } from '@/seo/jsonld'
import { pageMetadata } from '@/seo/metadata'

export const revalidate = 3600
export const generateStaticParams = () => []

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'site' })
  return pageMetadata({
    locale,
    path: '/blog',
    title: { absolute: t('metaTitle') },
    description: t('description'),
    paths: await blogIndexPaths(),
  })
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const live = await postReader.liveLocales()
  if (locale !== 'fr' && !live.includes(locale)) notFound()

  const t = await getTranslations({ locale, namespace: 'blog' })
  const [register, categories, paths] = await Promise.all([
    postReader.list({ locale }),
    taxonomyReader.categories(locale),
    blogIndexPaths(),
  ])

  const featured = (await postReader.featured(locale)) ?? register.items[0] ?? null
  const latest = register.items.filter((post) => post.id !== featured?.id).slice(0, 3)
  const newest = register.items[0]

  return (
    <PageShell locale={locale} paths={paths}>
      <JsonLd data={organizationJsonLd()} />

      <section className="container blog-hero">
        <span className="badge">{t('badge')}</span>
        <h1 className="display">{t('title')}</h1>
        <div className="blog-hero__row">
          <p className="lede">{t('subtitle')}</p>
          {register.total > 0 && (
            <a className="btn btn--primary" href="#registre">
              {t('viewAll')}
            </a>
          )}
        </div>
        {newest && (
          <p className="blog-hero__ledger mono">
            <span>{t('count', { count: register.total })}</span>
            <span>{t('lastEntry', { date: formatDate(newest.publishedAt, locale) })}</span>
          </p>
        )}
      </section>

      {register.total === 0 && (
        <section className="container">
          <p className="empty-state">{t('empty')}</p>
        </section>
      )}

      {featured && (
        <section className="container">
          <FeaturedPost post={featured} locale={locale} />
        </section>
      )}

      {latest.length > 0 && (
        <section className="container">
          <div className="card-grid">
            {latest.map((post) => (
              <PostCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {register.total > 0 && (
        <section className="container section" id="registre">
          <div className="section__head">
            <div>
              <h2 className="section__title">{t('registerTitle')}</h2>
              <p className="section__lead">{t('registerLead')}</p>
            </div>
          </div>
          <TopicChips categories={categories} locale={locale} total={register.total} />
          <Register posts={register.items} locale={locale} />
          <Pagination result={register} locale={locale} basePath="/blog" />
        </section>
      )}
    </PageShell>
  )
}
