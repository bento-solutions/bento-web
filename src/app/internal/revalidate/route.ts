import { revalidatePath } from 'next/cache'
import type { NextRequest } from 'next/server'

/**
 * Scheduled publishing runs outside any web request, where Next refuses to touch its cache.
 * The job calls this route on the app itself, so a scheduled post appears right away.
 */
export async function POST(req: NextRequest): Promise<Response> {
  if (!process.env.PREVIEW_SECRET || req.headers.get('x-revalidate-secret') !== process.env.PREVIEW_SECRET) {
    return new Response('Not allowed', { status: 403 })
  }
  revalidatePath('/', 'layout')
  return Response.json({ revalidated: true })
}
