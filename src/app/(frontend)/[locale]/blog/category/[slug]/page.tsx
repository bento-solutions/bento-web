import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { JsonLd } from '@/components/blog/JsonLd'
import { PageShell } from '@/components/blog/PageShell'
import { PostCard } from '@/components/blog/PostCard'
import { Register, TopicChips } from '@/components/blog/Register'
import type { Locale } from '@/domain/types'
import { Link } from '@/i18n/navigation'
import { postReader, taxonomyReader } from '@/infrastructure/container'
import { localizedPath } from '@/seo/hreflang'
import { breadcrumbJsonLd } from '@/seo/jsonld'
import { pageMetadata } from '@/seo/metadata'

export const revalidate = 3600
export const generateStaticParams = () => []

type Props = { params: Promise<{ locale: Locale; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const category = await taxonomyReader.categoryBySlug(decodeURIComponent(slug), locale)
  if (!category) return {}
  const tSite = await getTranslations({ locale, namespace: 'site' })
  return pageMetadata({
    locale,
    path: `/blog/category/${category.slug}`,
    title: category.name,
    description: category.description ?? tSite('description'),
    paths: await taxonomyReader.categoryPaths(category.id),
  })
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const category = await taxonomyReader.categoryBySlug(decodeURIComponent(slug), locale)
  if (!category) notFound()

  const [result, categories, allPosts, paths] = await Promise.all([
    postReader.list({ locale, categoryId: category.id, limit: 100 }),
    taxonomyReader.categories(locale),
    postReader.list({ locale, limit: 1 }),
    taxonomyReader.categoryPaths(category.id),
  ])
  if (!result.items.length) notFound()

  const t = await getTranslations({ locale, namespace: 'blog' })
  const top = result.items.slice(0, 3)
  const blogTitle = t('title')

  return (
    <PageShell locale={locale} paths={paths}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: blogTitle, path: localizedPath(locale, '/blog') },
          { name: category.name, path: localizedPath(locale, `/blog/category/${category.slug}`) },
        ])}
      />
      <section className="container blog-hero blog-hero--compact">
        <nav className="crumbs" aria-label="breadcrumb">
          <Link href="/blog" locale={locale}>
            {blogTitle}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{category.name}</span>
        </nav>
        <h1 className="display display--sm">{category.name}</h1>
        {category.description && <p className="lede">{category.description}</p>}
        <p className="blog-hero__ledger mono">
          <span>{t('count', { count: result.total })}</span>
        </p>
      </section>

      <section className="container">
        <div className="card-grid">
          {top.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      </section>

      <section className="container section">
        <TopicChips categories={categories} locale={locale} total={allPosts.total} activeId={category.id} />
        <Register posts={result.items} locale={locale} />
      </section>
    </PageShell>
  )
}
