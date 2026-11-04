import { type CollectionConfig, slugField } from 'payload'

import { anyone, editorsOnly } from '../access/roles'
import { revalidateSiteAfterChange, revalidateSiteAfterDelete } from '../hooks/revalidateSite'
import { slugify } from '../lib/slugify'

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: { fr: 'Signature', en: 'Byline' }, plural: { fr: 'Signatures', en: 'Bylines' } },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'jobTitle'],
    group: { fr: 'Le carnet', en: 'The notebook' },
    description: {
      fr: 'Les personnes affichées sur les articles. Une vraie personne avec une vraie page renforce la confiance de Google.',
      en: 'The people shown on posts. A real person with a real page builds trust with Google.',
    },
  },
  access: { create: editorsOnly, delete: editorsOnly, read: anyone, update: editorsOnly },
  hooks: { afterChange: [revalidateSiteAfterChange], afterDelete: [revalidateSiteAfterDelete] },
  fields: [
    { name: 'name', type: 'text', required: true, label: { fr: 'Nom', en: 'Name' } },
    slugField({ useAsSlug: 'name', slugify: ({ valueToSlugify }) => slugify(String(valueToSlugify ?? '')) }),
    { name: 'jobTitle', type: 'text', localized: true, label: { fr: 'Fonction', en: 'Job title' } },
    { name: 'bio', type: 'textarea', localized: true, label: { fr: 'Biographie', en: 'Bio' } },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: { fr: 'Photo', en: 'Photo' },
    },
    {
      name: 'linkedin',
      type: 'text',
      label: 'LinkedIn',
      validate: (value: string | null | undefined) =>
        !value || /^https:\/\/([a-z]+\.)?linkedin\.com\//.test(value) || 'URL LinkedIn invalide',
    },
  ],
}
