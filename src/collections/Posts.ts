import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  BlockquoteFeature,
  BlocksFeature,
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import { type CollectionConfig, slugField } from 'payload'

import {
  allowedReviewStatuses,
  editorsOnly,
  editorsOnlyField,
  loggedIn,
  loggedInField,
  nobodyField,
  readPosts,
  REVIEW_STATUSES,
  updatePosts,
} from '../access/roles'
import { CalloutBlock, CtaBlock, FaqBlock } from '../blocks'
import {
  enforceWorkflow,
  fillComputedFields,
  notifyEditorsOnReview,
  redirectChangedSlugs,
} from '../hooks/postWorkflow'
import { revalidateSiteAfterChange, revalidateSiteAfterDelete } from '../hooks/revalidateSite'
import { slugify } from '../lib/slugify'

const previewPath = (slug: unknown, locale: string): string | null => {
  if (typeof slug !== 'string' || !slug) return null
  const prefix = locale === 'fr' ? '' : `/${locale}`
  const params = new URLSearchParams({
    path: `${prefix}/blog/${encodeURIComponent(slug)}`,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })
  return `/next/preview?${params.toString()}`
}

export const reviewStatusLabels = {
  draft: { fr: 'Brouillon', en: 'Draft' },
  in_review: { fr: 'En relecture', en: 'In review' },
  approved: { fr: 'Approuvé', en: 'Approved' },
} as const

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: { fr: 'Article', en: 'Post' }, plural: { fr: 'Articles', en: 'Posts' } },
  defaultSort: '-updatedAt',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'reviewStatus', '_status', 'updatedAt'],
    group: { fr: 'Le carnet', en: 'The notebook' },
    listSearchableFields: ['title', 'excerpt'],
    livePreview: {
      url: ({ data, locale }) => previewPath(data?.slug, locale?.code ?? 'fr'),
      breakpoints: [
        { name: 'mobile', label: 'Téléphone', width: 390, height: 844 },
        { name: 'desktop', label: 'Ordinateur', width: 1440, height: 900 },
      ],
    },
    preview: (data, { locale }) => previewPath(data?.slug, locale ?? 'fr'),
    components: {
      edit: {
        PublishButton: '/components/admin/PublishButton#PublishButton',
      },
    },
  },
  access: {
    create: loggedIn,
    delete: editorsOnly,
    read: readPosts,
    update: updatePosts,
    readVersions: loggedIn,
  },
  versions: {
    maxPerDoc: 50,
    drafts: {
      autosave: { interval: 2000 },
      schedulePublish: true,
      validate: false,
    },
  },
  hooks: {
    beforeChange: [enforceWorkflow, fillComputedFields],
    afterChange: [notifyEditorsOnReview, redirectChangedSlugs, revalidateSiteAfterChange],
    afterDelete: [revalidateSiteAfterDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { fr: 'Titre', en: 'Title' },
      admin: {
        description: {
          fr: 'Une promesse claire, avec les mots que vos lecteurs tapent dans Google.',
          en: 'A clear promise, using the words your readers type into Google.',
        },
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: { fr: 'Contenu', en: 'Content' },
          fields: [
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              localized: true,
              maxLength: 240,
              label: { fr: 'Chapô', en: 'Standfirst' },
              admin: {
                description: {
                  fr: 'Deux phrases qui donnent envie de lire. Affiché sur les cartes et en haut de l’article.',
                  en: 'Two sentences that make people want to read. Shown on cards and at the top of the post.',
                },
              },
            },
            {
              name: 'hero',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: { fr: 'Couverture (image ou vidéo)', en: 'Cover (image or video)' },
            },
            {
              name: 'body',
              type: 'richText',
              required: true,
              localized: true,
              label: { fr: 'Article', en: 'Body' },
              editor: lexicalEditor({
                // A deliberately short list: no H1, no colours, nothing that breaks the layout when pasted.
                features: () => [
                  ParagraphFeature(),
                  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
                  BoldFeature(),
                  ItalicFeature(),
                  UnorderedListFeature(),
                  OrderedListFeature(),
                  BlockquoteFeature(),
                  HorizontalRuleFeature(),
                  LinkFeature({ enabledCollections: ['posts'] }),
                  UploadFeature({ collections: { media: { fields: [] } } }),
                  EXPERIMENTAL_TableFeature(),
                  BlocksFeature({ blocks: [CtaBlock, CalloutBlock, FaqBlock] }),
                  FixedToolbarFeature(),
                  InlineToolbarFeature(),
                ],
              }),
            },
          ],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({ hasGenerateFn: true, overrides: { localized: true } }),
            MetaDescriptionField({ hasGenerateFn: true, overrides: { localized: true } }),
            MetaImageField({ relationTo: 'media', hasGenerateFn: true }),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
            {
              name: 'noindex',
              type: 'checkbox',
              label: { fr: 'Masquer cet article de Google', en: 'Hide this post from Google' },
            },
            {
              name: 'canonicalUrl',
              type: 'text',
              label: { fr: 'URL canonique (rare)', en: 'Canonical URL (rare)' },
              admin: {
                description: {
                  fr: 'Seulement si l’article a d’abord été publié ailleurs. Sinon, laissez vide.',
                  en: 'Only if the post was first published elsewhere. Otherwise leave empty.',
                },
              },
            },
          ],
        },
        {
          label: { fr: 'Stratégie', en: 'Strategy' },
          description: {
            fr: 'Notes internes, jamais affichées sur le site.',
            en: 'Internal notes, never shown on the site.',
          },
          fields: [
            {
              name: 'targetKeyword',
              type: 'text',
              localized: true,
              access: { read: loggedInField },
              label: { fr: 'Mot-clé visé', en: 'Target keyword' },
            },
            {
              name: 'searchIntent',
              type: 'select',
              access: { read: loggedInField },
              label: { fr: 'Intention de recherche', en: 'Search intent' },
              options: [
                { value: 'learn', label: { fr: 'S’informer', en: 'Learn' } },
                { value: 'compare', label: { fr: 'Comparer', en: 'Compare' } },
                { value: 'buy', label: { fr: 'Acheter', en: 'Buy' } },
              ],
            },
            {
              name: 'reviewNotes',
              type: 'textarea',
              access: { read: loggedInField },
              label: { fr: 'Notes de relecture', en: 'Review notes' },
            },
            {
              name: 'aiAssisted',
              type: 'checkbox',
              access: { read: loggedInField },
              label: { fr: 'Rédigé avec l’aide de l’IA', en: 'Written with AI assistance' },
            },
          ],
        },
      ],
    },
    {
      name: 'reviewStatus',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      access: { read: loggedInField },
      label: { fr: 'Relecture', en: 'Review' },
      options: REVIEW_STATUSES.map((value) => ({ value, label: reviewStatusLabels[value] })),
      // Requests without a user are trusted system calls, such as scheduled publishing.
      filterOptions: ({ req, options }) =>
        req.user
          ? options.filter((option) =>
              allowedReviewStatuses(req.user).includes(
                (typeof option === 'string' ? option : option.value) as (typeof REVIEW_STATUSES)[number],
              ),
            )
          : options,
      admin: {
        position: 'sidebar',
        description: {
          fr: 'Passez à « En relecture » quand l’article est prêt : les éditeurs reçoivent un e-mail.',
          en: 'Switch to "In review" when the post is ready: editors get an email.',
        },
      },
    },
    slugField({
      localized: true,
      slugify: ({ valueToSlugify }) => slugify(String(valueToSlugify ?? '')),
    }),
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      index: true,
      label: { fr: 'Thème', en: 'Topic' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
      required: true,
      label: { fr: 'Signature', en: 'Byline' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      label: { fr: 'Date de publication', en: 'Publication date' },
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } },
    },
    {
      name: 'featured',
      type: 'checkbox',
      index: true,
      access: { update: editorsOnlyField, create: editorsOnlyField },
      label: { fr: 'À la une', en: 'Featured' },
      admin: {
        position: 'sidebar',
        description: {
          fr: 'L’article à la une le plus récent occupe le haut de la page du blog.',
          en: 'The most recent featured post takes the top of the blog page.',
        },
      },
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      label: { fr: 'Articles liés', en: 'Related posts' },
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: { position: 'sidebar' },
    },
    {
      name: 'entryNumber',
      type: 'number',
      index: true,
      access: { create: nobodyField, update: nobodyField },
      label: { fr: 'N° au registre', en: 'Ledger number' },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'readingMinutes',
      type: 'number',
      localized: true,
      access: { create: nobodyField, update: nobodyField },
      label: { fr: 'Temps de lecture (min)', en: 'Reading time (min)' },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: { create: nobodyField, update: nobodyField, read: loggedInField },
      admin: { hidden: true },
    },
  ],
}
