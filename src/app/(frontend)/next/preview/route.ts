import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { getPayload, type PayloadRequest } from 'payload'
import { getSafeRedirect } from 'payload/shared'

/** Turns on draft mode for someone signed in to the admin, then sends them to the page. */
export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config })
  const { searchParams } = new URL(req.url)

  if (searchParams.get('previewSecret') !== process.env.PREVIEW_SECRET) {
    return new Response('Not allowed', { status: 403 })
  }

  const safePath = getSafeRedirect({ fallbackTo: '', redirectTo: searchParams.get('path') ?? '' })
  if (!safePath) return new Response('Invalid path', { status: 400 })

  const draft = await draftMode()
  const { user } = await payload.auth({ req: req as unknown as PayloadRequest, headers: req.headers })
  if (!user) {
    draft.disable()
    return new Response('Not allowed', { status: 403 })
  }

  draft.enable()
  redirect(safePath)
}
