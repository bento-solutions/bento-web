import type { CollectionConfig } from 'payload'

import { adminsOnly, adminsOnlyField, isAdmin, ROLES } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: { fr: 'Utilisateur', en: 'User' }, plural: { fr: 'Utilisateurs', en: 'Users' } },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: { fr: 'Administration', en: 'Administration' },
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 12 * 60 * 60,
  },
  access: {
    create: adminsOnly,
    delete: adminsOnly,
    read: ({ req }) => {
      if (isAdmin(req.user)) return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    update: ({ req }) => {
      if (isAdmin(req.user)) return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    admin: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      // The account created on first launch has to be able to manage everything else.
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        return totalDocs === 0 ? { ...data, role: 'admin' } : data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: { fr: 'Nom', en: 'Name' } },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'author',
      access: { create: adminsOnlyField, update: adminsOnlyField },
      saveToJWT: true,
      label: { fr: 'Rôle', en: 'Role' },
      options: ROLES.map((value) => ({
        value,
        label: {
          admin: { fr: 'Administrateur', en: 'Admin' },
          editor: { fr: 'Éditeur', en: 'Editor' },
          author: { fr: 'Auteur', en: 'Author' },
        }[value],
      })),
      admin: {
        description: {
          fr: 'Auteur : écrit et soumet ses articles. Éditeur : relit et publie. Administrateur : gère aussi les comptes.',
          en: 'Author: writes and submits posts. Editor: reviews and publishes. Admin: also manages accounts.',
        },
      },
    },
  ],
}
