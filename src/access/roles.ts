import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

export const ROLES = ['admin', 'editor', 'author'] as const
export type Role = (typeof ROLES)[number]

export const REVIEW_STATUSES = ['draft', 'in_review', 'approved'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

type MaybeUser = { id?: number | string; role?: Role | null } | null | undefined

export const isAdmin = (user: MaybeUser): boolean => user?.role === 'admin'
export const isEditorOrAdmin = (user: MaybeUser): boolean => user?.role === 'admin' || user?.role === 'editor'

/** Authors write. Editors and admins decide what goes live. */
export const canPublish = isEditorOrAdmin

export const allowedReviewStatuses = (user: MaybeUser): readonly ReviewStatus[] =>
  isEditorOrAdmin(user) ? REVIEW_STATUSES : ['draft', 'in_review']

type WithUser = { req: PayloadRequest }

export const anyone: Access = () => true
export const loggedIn: Access = ({ req }: WithUser) => Boolean(req.user)
export const editorsOnly: Access = ({ req }: WithUser) => isEditorOrAdmin(req.user)
export const adminsOnly: Access = ({ req }: WithUser) => isAdmin(req.user)

export const loggedInField: FieldAccess = ({ req }) => Boolean(req.user)
export const editorsOnlyField: FieldAccess = ({ req }) => isEditorOrAdmin(req.user)
export const adminsOnlyField: FieldAccess = ({ req }) => isAdmin(req.user)
export const nobodyField: FieldAccess = () => false

/** Visitors see published posts. Authors also see their own drafts. Editors see everything. */
export const readPosts: Access = ({ req }) => {
  if (isEditorOrAdmin(req.user)) return true
  if (req.user) {
    const mineOrPublished: Where = {
      or: [{ _status: { equals: 'published' } }, { createdBy: { equals: req.user.id } }],
    }
    return mineOrPublished
  }
  return { _status: { equals: 'published' } }
}

/** Authors can only change what they wrote. */
export const updatePosts: Access = ({ req }) => {
  if (isEditorOrAdmin(req.user)) return true
  if (req.user) return { createdBy: { equals: req.user.id } }
  return false
}

export const updateOwnMedia: Access = ({ req }) => {
  if (isEditorOrAdmin(req.user)) return true
  if (req.user) return { uploadedBy: { equals: req.user.id } }
  return false
}
