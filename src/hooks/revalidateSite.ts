import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

const askAppToRevalidate = async (req: PayloadRequest): Promise<void> => {
  try {
    await fetch(`http://localhost:${process.env.PORT || 3000}/internal/revalidate`, {
      method: 'POST',
      headers: { 'x-revalidate-secret': process.env.PREVIEW_SECRET || '' },
    })
  } catch (err) {
    // Pages also refresh by themselves every hour.
    req.payload.logger.warn({ err }, 'Could not refresh pages after a background publication')
  }
}

const revalidate = async (req: PayloadRequest): Promise<void> => {
  if (req.context.disableRevalidate) return
  try {
    revalidatePath('/', 'layout')
  } catch {
    await askAppToRevalidate(req)
  }
}

export const revalidateSiteAfterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  await revalidate(req)
  return doc
}

export const revalidateSiteAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await revalidate(req)
  return doc
}
