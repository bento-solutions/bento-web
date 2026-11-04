import { redirect } from 'next/navigation'

import type { Locale } from '@/domain/types'
import { localizedPath } from '@/seo/hreflang'

/** The homepage still lives in the brochure app. In production Traefik never sends `/` here. */
export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  redirect(localizedPath(locale, '/blog'))
}
