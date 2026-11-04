import { getTranslations } from 'next-intl/server'
import { draftMode } from 'next/headers'
import NextLink from 'next/link'

import type { Locale, LocalePaths } from '@/domain/types'
import { Link } from '@/i18n/navigation'
import { postReader, taxonomyReader } from '@/infrastructure/container'
import { products, site } from '@/lib/site'
import { localizedPath } from '@/seo/hreflang'

import { ArrowIcon, LogoMark } from './icons'
import { LivePreviewListener } from './LivePreviewListener'
import { ThemeToggle } from './ThemeToggle'

const LANGUAGE_NAMES: Record<Locale, string> = { fr: 'Français', en: 'English', ar: 'العربية' }

const LanguageLinks = ({ paths, locale, label }: { paths?: LocalePaths; locale: Locale; label: string }) => {
  const others = (Object.entries(paths ?? {}) as [Locale, string][]).filter(([code]) => code !== locale)
  if (!others.length) return null
  return (
    <nav className="languages" aria-label={label}>
      {others.map(([code, path]) => (
        // A plain link: switching language is a full navigation to another document.
        <a key={code} href={path} hrefLang={code} lang={code} className="languages__link">
          {LANGUAGE_NAMES[code]}
        </a>
      ))}
    </nav>
  )
}

const Header = async ({ locale, paths }: { locale: Locale; paths?: LocalePaths }) => {
  const t = await getTranslations({ locale, namespace: 'nav' })
  const tSite = await getTranslations({ locale, namespace: 'site' })
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/blog" locale={locale} className="brand">
          <LogoMark className="brand__mark" />
          <span className="brand__name">Bento</span>
          <span className="brand__section">{tSite('brand')}</span>
        </Link>
        <div className="site-header__actions">
          <LanguageLinks paths={paths} locale={locale} label={t('languages')} />
          <ThemeToggle label={t('toggleTheme')} />
          <a className="btn btn--primary btn--sm" href={`${site.homeUrl}/#book-a-demo`}>
            {t('tryBento')}
          </a>
        </div>
      </div>
    </header>
  )
}

const CtaBand = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'cta' })
  return (
    <section className="cta-band">
      <div className="container cta-band__inner">
        <div>
          <h2 className="cta-band__title">{t('title')}</h2>
          <p className="cta-band__text">{t('text')}</p>
        </div>
        <div className="cta-band__actions">
          <a className="btn btn--on-accent" href={`${site.homeUrl}/#book-a-demo`}>
            {t('button')} <ArrowIcon />
          </a>
          <a className="btn btn--ghost-on-accent" href={`${site.homeUrl}/#products`}>
            {t('secondary')}
          </a>
        </div>
      </div>
    </section>
  )
}

const Footer = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'footer' })
  const categories = await taxonomyReader.categories(locale)
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__about">
            <span className="brand brand--footer">
              <LogoMark className="brand__mark" />
              <span className="brand__name">Bento</span>
            </span>
            <p>{t('about')}</p>
          </div>
          {categories.length > 0 && (
            <div>
              <h2 className="site-footer__heading">{t('notebook')}</h2>
              <ul>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link href={`/blog/category/${category.slug}`} locale={locale}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h2 className="site-footer__heading">{t('products')}</h2>
            <ul>
              {Object.values(products).map((product) => (
                <li key={product.url}>
                  <a href={product.url}>{product.name}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="site-footer__heading">{t('company')}</h2>
            <ul>
              <li>
                <a href={site.homeUrl}>{t('website')}</a>
              </li>
              <li>
                <a href={`mailto:${site.email}`}>{t('contact')}</a>
              </li>
              <li>
                <a href={localizedPath(locale, '/blog/rss.xml')}>{t('rss')}</a>
              </li>
            </ul>
          </div>
        </div>
        <p className="site-footer__legal mono">{t('rights', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  )
}

const PreviewBar = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'article' })
  return (
    <div className="preview-bar" role="status">
      {t('preview')}{' '}
      <NextLink href="/next/exit-preview" prefetch={false}>
        {t('exitPreview')}
      </NextLink>
      <LivePreviewListener />
    </div>
  )
}

type PageShellProps = {
  locale: Locale
  /** Where this same page lives in other languages. Leave empty if it only exists in this one. */
  paths?: LocalePaths
  children: React.ReactNode
}

export const PageShell = async ({ locale, paths, children }: PageShellProps) => {
  const { isEnabled: draft } = await draftMode()
  const t = await getTranslations({ locale, namespace: 'site' })
  return (
    <>
      <a className="skip-link" href="#contenu">
        {t('skip')}
      </a>
      {draft && <PreviewBar locale={locale} />}
      <Header locale={locale} paths={paths} />
      <main id="contenu">{children}</main>
      <CtaBand locale={locale} />
      <Footer locale={locale} />
    </>
  )
}

/** Paths of the blog index in every language that already has posts. */
export const blogIndexPaths = async (suffix = '/blog'): Promise<LocalePaths> => {
  const live = await postReader.liveLocales()
  return Object.fromEntries(live.map((locale) => [locale, localizedPath(locale, suffix)]))
}
