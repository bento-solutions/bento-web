'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

/** Refreshes the page inside the admin's live preview each time the post is saved. */
export const LivePreviewListener = () => {
  const router = useRouter()
  const serverURL = typeof window === 'undefined' ? '' : window.location.origin
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={serverURL} />
}
