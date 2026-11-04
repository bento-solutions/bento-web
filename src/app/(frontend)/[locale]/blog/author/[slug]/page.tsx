import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PageShell } from '@/components/blog/PageShell'
import { Register } from '@/components/blog/Register'
import type { Locale } from '@/domain/types'
import { postReader, taxonomyReader } from '@/infrastructure/container'
import { pageMetadata } from '@/seo/metadata'

export const revalidate = 3600
export const generateStaticParams = () => []

type Props = { params: Promise<{ locale: Locale; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const author = await taxonomyReader.authorBySlug(decodeURIComponent(slug), locale)
  if (!author) return {}
  return pageMetadata({
    locale,
    path: `/blog/author/${author.slug}`,
    title: author.name,
    description: author.bio ?? author.name,
  })
}

export default async function AuthorPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const author = await taxonomyReader.authorBySlug(decodeURIComponent(slug), locale)
  if (!author) notFound()

  const result = await postReader.list({ locale, authorId: author.id, limit: 100 })
  if (!result.items.length) notFound()

  const t = await getTranslations({ locale, namespace: 'author' })
  const tBlog = await getTranslations({ locale, namespace: 'blog' })

  return (
    <PageShell locale={locale}>
      <section className="container blog-hero blog-hero--compact">
        <h1 className="display display--sm">{author.name}</h1>
        {author.jobTitle && <p className="author-role mono">{author.jobTitle}</p>}
        {author.bio && <p className="lede">{author.bio}</p>}
        {author.linkedin && (
          <a className="text-link" href={author.linkedin} rel="noopener noreferrer me">
            LinkedIn
          </a>
        )}
      </section>
      <section className="container section section--tight">
        <h2 className="section__title">{t('articlesBy', { name: author.name })}</h2>
        <p className="section__lead">{tBlog('count', { count: result.total })}</p>
        <Register posts={result.items} locale={locale} />
      </section>
    </PageShell>
  )
}
