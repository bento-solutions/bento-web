import type { Metadata, Viewport } from 'next'
import { Cairo, Geist_Mono, Instrument_Sans } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { themeScript } from '@/components/blog/ThemeToggle'
import { routing } from '@/i18n/routing'
import { site, siteUrl } from '@/lib/site'

import '../globals.css'

const instrument = Instrument_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-instrument',
  display: 'swap',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
})
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cairo',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: site.name, template: `%s · ${site.name}` },
  icons: { icon: site.logoPath },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F7F5' },
    { media: '(prefers-color-scheme: dark)', color: '#121211' },
  ],
}

// Nothing is rendered at build time, when the database is out of reach. Each page is
// generated on its first visit, cached, and refreshed when something is published.
export const generateStaticParams = () => []

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${instrument.variable} ${geistMono.variable} ${cairo.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {/* Links need the locale on the client. Translations stay on the server, so none are sent. */}
        <NextIntlClientProvider locale={locale} messages={null}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
