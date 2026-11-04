import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_NOINDEX === '1') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
