import type { Block } from 'payload'

import { products } from '../lib/site'

/** Sends the reader to a Bento product. This is how the blog turns traffic into leads. */
export const CtaBlock: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  labels: { singular: { fr: 'Appel à l’action', en: 'Call to action' }, plural: { fr: 'Appels à l’action', en: 'Calls to action' } },
  fields: [
    {
      name: 'product',
      type: 'select',
      required: true,
      defaultValue: 'crm',
      label: { fr: 'Produit', en: 'Product' },
      options: Object.entries(products).map(([value, product]) => ({ value, label: product.name })),
    },
    { name: 'title', type: 'text', required: true, label: { fr: 'Titre', en: 'Title' } },
    { name: 'text', type: 'textarea', label: { fr: 'Texte', en: 'Text' } },
    { name: 'buttonLabel', type: 'text', required: true, label: { fr: 'Bouton', en: 'Button' } },
  ],
}

export const CalloutBlock: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  labels: { singular: { fr: 'Encadré', en: 'Callout' }, plural: { fr: 'Encadrés', en: 'Callouts' } },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'tip',
      label: { fr: 'Type', en: 'Kind' },
      options: [
        { value: 'tip', label: { fr: 'Conseil', en: 'Tip' } },
        { value: 'note', label: { fr: 'À savoir', en: 'Good to know' } },
        { value: 'warning', label: { fr: 'Attention', en: 'Watch out' } },
      ],
    },
    { name: 'text', type: 'textarea', required: true, label: { fr: 'Texte', en: 'Text' } },
  ],
}

export const FaqBlock: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  labels: { singular: { fr: 'Questions fréquentes', en: 'FAQ' }, plural: { fr: 'Questions fréquentes', en: 'FAQs' } },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      label: { fr: 'Questions', en: 'Questions' },
      fields: [
        { name: 'question', type: 'text', required: true, label: { fr: 'Question', en: 'Question' } },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
          label: { fr: 'Réponse', en: 'Answer' },
          admin: {
            description: {
              fr: 'Répondez directement dès la première phrase.',
              en: 'Answer directly in the first sentence.',
            },
          },
        },
      ],
    },
  ],
}
