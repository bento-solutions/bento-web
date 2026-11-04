import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PageShell } from '@/components/blog/PageShell'
import { Pagination, Register, TopicChips } from '@/components/blog/Register'
import type { Locale } from '@/domain/types'
import { postReader, taxonomyReader } from '@/infrastructure/container'
import { localizedPath } from '@/seo/hreflang'
import { pageMetadata } from '@/seo/metadata'

export const revalidate = 3600
export const generateStaticParams = () => []

type Props = { params: Promise<{ locale: Locale; page: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, page } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })
  return pageMetadata({
    locale,
    path: `/blog/page/${page}`,
    title: t('pageTitle', { page }),
    description: t('registerLead'),
  })
}

export default async function BlogArchivePage({ params }: Props) {
  const { locale, page: rawPage } = await params
  setRequestLocale(locale)

  const page = Number(rawPage)
  if (!Number.isInteger(page) || page < 1) notFound()
  if (page === 1) redirect(localizedPath(locale, '/blog'))

  const result = await postReader.list({ locale, page })
  if (!result.items.length) notFound()

  const t = await getTranslations({ locale, namespace: 'blog' })
  const categories = await taxonomyReader.categories(locale)

  return (
    <PageShell locale={locale}>
      <section className="container section section--first">
        <div className="section__head">
          <div>
            <h1 className="section__title section__title--page">{t('registerTitle')}</h1>
            <p className="section__lead">{t('pageOf', { page: result.page, total: result.totalPages })}</p>
          </div>
        </div>
        <TopicChips categories={categories} locale={locale} total={result.total} />
        <Register posts={result.items} locale={locale} />
        <Pagination result={result} locale={locale} basePath="/blog" />
      </section>
    </PageShell>
  )
}
