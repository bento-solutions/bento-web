import { type CollectionConfig, slugField } from 'payload'

import { anyone, editorsOnly } from '../access/roles'
import { revalidateSiteAfterChange, revalidateSiteAfterDelete } from '../hooks/revalidateSite'
import { slugify } from '../lib/slugify'

/** Editors pick a named tone instead of a hex code, so every badge stays inside the palette. */
export const CATEGORY_TONES = ['teal', 'copper', 'green', 'violet', 'ochre', 'clay', 'graphite'] as const
export type CategoryTone = (typeof CATEGORY_TONES)[number]

const toneLabels: Record<CategoryTone, { fr: string; en: string }> = {
  teal: { fr: 'Bleu canard', en: 'Teal' },
  copper: { fr: 'Cuivre', en: 'Copper' },
  green: { fr: 'Vert', en: 'Green' },
  violet: { fr: 'Violet', en: 'Violet' },
  ochre: { fr: 'Ocre', en: 'Ochre' },
  clay: { fr: 'Argile', en: 'Clay' },
  graphite: { fr: 'Graphite', en: 'Graphite' },
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: { fr: 'Thème', en: 'Topic' }, plural: { fr: 'Thèmes', en: 'Topics' } },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'tone', 'displayOrder'],
    group: { fr: 'Le carnet', en: 'The notebook' },
    description: {
      fr: 'Chaque thème a sa propre page, qui regroupe tous ses articles.',
      en: 'Every topic gets its own page listing its posts.',
    },
  },
  defaultSort: 'displayOrder',
  access: { create: editorsOnly, delete: editorsOnly, read: anyone, update: editorsOnly },
  hooks: { afterChange: [revalidateSiteAfterChange], afterDelete: [revalidateSiteAfterDelete] },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true, label: { fr: 'Nom', en: 'Name' } },
    slugField({
      useAsSlug: 'name',
      localized: true,
      slugify: ({ valueToSlugify }) => slugify(String(valueToSlugify ?? '')),
    }),
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: { fr: 'Description', en: 'Description' },
      admin: {
        description: {
          fr: 'Une ou deux phrases en haut de la page du thème.',
          en: 'One or two sentences at the top of the topic page.',
        },
      },
    },
    {
      name: 'tone',
      type: 'select',
      required: true,
      defaultValue: 'graphite',
      label: { fr: 'Couleur du badge', en: 'Badge colour' },
      options: CATEGORY_TONES.map((value) => ({ value, label: toneLabels[value] })),
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 100,
      label: { fr: 'Ordre', en: 'Order' },
      admin: { position: 'sidebar' },
    },
  ],
}
