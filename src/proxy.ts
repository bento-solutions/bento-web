import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'

import { routing } from './i18n/routing'
import { firstAdminGate, SETUP_COOKIE, SETUP_PARAM } from './lib/first-admin-gate'

const intl = createMiddleware(routing)

const ADMIN_PATHS = /^\/(admin|api|next)(\/|$)/
const DRAFT_COOKIE = '__prerender_bypass'
const ADMIN_LANGUAGE_COOKIE = 'payload-lng'

const hostOf = (req: NextRequest): string => (req.headers.get('host') ?? '').split(':')[0]

/** The team works in French whatever their browser says, until someone picks a language in their account. */
const nextForAdmin = (req: NextRequest): NextResponse => {
  if (req.cookies.has(ADMIN_LANGUAGE_COOKIE)) return NextResponse.next()
  const headers = new Headers(req.headers)
  headers.set('accept-language', 'fr')
  return NextResponse.next({ request: { headers } })
}

/**
 * One app, two hostnames. bento212.com serves readers and never exposes the admin.
 * The CMS host serves the admin and API, plus pages only for someone previewing a draft.
 * Without CMS_HOST (local development) a single host serves everything.
 */
export default function proxy(req: NextRequest): NextResponse {
  const cmsHost = process.env.CMS_HOST
  const { pathname } = req.nextUrl
  const isAdminPath = ADMIN_PATHS.test(pathname)

  const gate = firstAdminGate({
    pathname,
    token: process.env.SETUP_TOKEN,
    cookie: req.cookies.get(SETUP_COOKIE)?.value,
    param: req.nextUrl.searchParams.get(SETUP_PARAM),
  })
  if (gate === 'deny') return new NextResponse(null, { status: 404 })
  if (gate === 'unlock') {
    const clean = req.nextUrl.clone()
    clean.searchParams.delete(SETUP_PARAM)
    const response = NextResponse.redirect(clean)
    response.cookies.set(SETUP_COOKIE, process.env.SETUP_TOKEN as string, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.nextUrl.protocol === 'https:',
      maxAge: 60 * 60,
      path: '/',
    })
    return response
  }

  if (cmsHost) {
    const onCmsHost = hostOf(req) === cmsHost
    if (!onCmsHost && isAdminPath) return new NextResponse(null, { status: 404 })
    if (onCmsHost && !isAdminPath && !req.cookies.has(DRAFT_COOKIE)) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    if (onCmsHost) {
      const response = isAdminPath ? nextForAdmin(req) : intl(req)
      response.headers.set('X-Robots-Tag', 'noindex, nofollow')
      return response
    }
  }

  const response = isAdminPath ? nextForAdmin(req) : intl(req)
  if (process.env.SITE_NOINDEX === '1') response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

export const config = {
  matcher: [
    // Everything except build assets, media, internal routes and files with an extension.
    '/((?!_next|_vercel|media|healthz|internal|.*\\..*).*)',
    // The exceptions that do have an extension but still need the language routing.
    '/blog/rss.xml',
    '/(en|ar)/blog/rss.xml',
  ],
}
