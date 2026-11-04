'use client'

import { PublishButton as DefaultPublishButton, useAuth } from '@payloadcms/ui'

import { canPublish } from '@/access/roles'

/** Authors never see Publish or Schedule. The server enforces the same rule in enforceWorkflow. */
export const PublishButton = (props: React.ComponentProps<typeof DefaultPublishButton>) => {
  const { user } = useAuth()
  if (!canPublish(user as { role?: 'admin' | 'editor' | 'author' } | null)) return null
  return <DefaultPublishButton {...props} />
}
