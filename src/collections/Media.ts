import path from 'path'
import type { CollectionConfig } from 'payload'
import { fileURLToPath } from 'url'

import { anyone, editorsOnly, loggedIn, updateOwnMedia } from '../access/roles'
import { revalidateSiteAfterChange } from '../hooks/revalidateSite'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const staticDir = process.env.MEDIA_DIR
  ? path.resolve(process.env.MEDIA_DIR)
  : path.resolve(dirname, '../../media')

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: { fr: 'Média', en: 'Media' }, plural: { fr: 'Médias', en: 'Media' } },
  admin: {
    group: { fr: 'Le carnet', en: 'The notebook' },
    defaultColumns: ['filename', 'alt', 'source'],
  },
  access: { create: loggedIn, delete: editorsOnly, read: anyone, update: updateOwnMedia },
  hooks: {
    afterChange: [revalidateSiteAfterChange],
    beforeChange: [
      ({ data, operation, req }) =>
        operation === 'create' && req.user ? { ...data, uploadedBy: req.user.id } : data,
    ],
  },
  upload: {
    staticDir,
    // SVG stays out on purpose: an uploaded SVG can carry scripts.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'],
    focalPoint: true,
    crop: true,
    adminThumbnail: 'card',
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'card', width: 640, formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'feature', width: 1280, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'cover', width: 1920, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
    // Payload gives every new file a new name, so URLs are safe to cache for a long time.
    modifyResponseHeaders: ({ headers }) => {
      const next = new Headers(headers)
      next.set('Cache-Control', 'public, max-age=31536000, immutable')
      return next
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      label: { fr: 'Texte alternatif', en: 'Alt text' },
      admin: {
        description: {
          fr: 'Décrivez ce que montre l’image, comme à quelqu’un qui ne la voit pas. Google et les lecteurs d’écran s’en servent.',
          en: 'Describe what the image shows, as you would to someone who cannot see it. Google and screen readers use it.',
        },
      },
    },
    { name: 'caption', type: 'text', localized: true, label: { fr: 'Légende', en: 'Caption' } },
    { name: 'credit', type: 'text', label: { fr: 'Crédit', en: 'Credit' } },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      label: { fr: 'Image de la vidéo', en: 'Video poster' },
      filterOptions: { mimeType: { contains: 'image' } },
      admin: {
        description: {
          fr: 'Pour une vidéo : l’image affichée avant la lecture et sur les réseaux sociaux.',
          en: 'For a video: the image shown before playback and on social networks.',
        },
        condition: (data) => String(data?.mimeType ?? '').startsWith('video/'),
      },
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'upload',
      label: { fr: 'Origine', en: 'Source' },
      options: [
        { value: 'upload', label: { fr: 'Fichier importé', en: 'Uploaded file' } },
        { value: 'ai', label: { fr: 'Générée par IA', en: 'AI generated' } },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      access: { update: () => false },
      admin: { hidden: true },
    },
  ],
}
