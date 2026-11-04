import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

/** Used by Docker and deploy.sh. Healthy means the app can reach its database. */
export async function GET(): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    await payload.count({ collection: 'categories' })
    return Response.json({ status: 'ok' })
  } catch {
    return Response.json({ status: 'error' }, { status: 503 })
  }
}
