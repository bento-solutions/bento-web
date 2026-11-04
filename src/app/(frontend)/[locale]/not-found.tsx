import { getLocale, getTranslations } from 'next-intl/server'

import { PageShell } from '@/components/blog/PageShell'
import type { Locale } from '@/domain/types'
import { Link } from '@/i18n/navigation'

export default async function NotFound() {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations({ locale, namespace: 'notFound' })
  return (
    <PageShell locale={locale}>
      <section className="container not-found">
        <p className="mono not-found__code">{t('code')}</p>
        <h1 className="display">{t('title')}</h1>
        <p className="lede">{t('text')}</p>
        <Link href="/blog" locale={locale} className="btn btn--primary">
          {t('back')}
        </Link>
      </section>
    </PageShell>
  )
}
