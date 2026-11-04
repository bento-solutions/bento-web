import type { DefaultNodeTypes, SerializedBlockNode, SerializedLinkNode } from '@payloadcms/richtext-lexical'
import {
  type JSXConvertersFunction,
  LinkJSXConverter,
  RichText as LexicalRichText,
} from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/domain/types'
import { mapMedia } from '@/infrastructure/media-mapper'
import { headingId, type LexicalDocument, type LexicalNode, nodeText } from '@/lib/lexical'
import { type ProductKey, products } from '@/lib/site'
import type { CalloutBlock, CtaBlock, FaqBlock, Media } from '@/payload-types'
import { localizedPath } from '@/seo/hreflang'

import { ArrowIcon, PlusIcon } from './icons'
import { Picture } from './MediaFrame'

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<CtaBlock | CalloutBlock | FaqBlock>

type Labels = { tip: string; note: string; warning: string; faq: string }

const Callout = ({ fields, labels }: { fields: CalloutBlock; labels: Labels }) => (
  <aside className={`callout callout--${fields.kind}`}>
    <p className="callout__label">{labels[fields.kind]}</p>
    <p>{fields.text}</p>
  </aside>
)

const Cta = ({ fields }: { fields: CtaBlock }) => {
  const product = products[fields.product as ProductKey]
  return (
    <aside className="product-cta">
      <div>
        <p className="product-cta__product mono">{product.name}</p>
        <p className="product-cta__title">{fields.title}</p>
        {fields.text && <p className="product-cta__text">{fields.text}</p>}
      </div>
      <a className="btn btn--primary" href={product.url}>
        {fields.buttonLabel} <ArrowIcon />
      </a>
    </aside>
  )
}

const Faq = ({ fields, labels }: { fields: FaqBlock; labels: Labels }) => (
  <section className="faq">
    <h2 className="faq__title">{labels.faq}</h2>
    {fields.items.map((item, index) => (
      <details key={item.id ?? index} className="faq__item">
        <summary>
          <span>{item.question}</span>
          <PlusIcon size={18} className="faq__icon" />
        </summary>
        <p>{item.answer}</p>
      </details>
    ))}
  </section>
)

const converters =
  (locale: Locale, labels: Labels): JSXConvertersFunction<NodeTypes> =>
  ({ defaultConverters }) => {
    // Rendering runs top to bottom, so a counter numbers the H2s the same way the table of contents does.
    let h2Index = 0
    const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
      const value = linkNode.fields.doc?.value
      const slug = typeof value === 'object' && value && 'slug' in value ? String(value.slug) : ''
      return localizedPath(locale, `/blog/${slug}`)
    }
    return {
      ...defaultConverters,
      ...LinkJSXConverter({ internalDocToHref }),
      heading: ({ node, nodesToJSX }) => {
        const children = nodesToJSX({ nodes: node.children })
        if (node.tag !== 'h2') {
          const Tag = node.tag
          return <Tag>{children}</Tag>
        }
        const id = headingId(nodeText(node as unknown as LexicalNode), h2Index)
        h2Index += 1
        return (
          <h2 id={id}>
            <span className="prose__number mono" aria-hidden="true">
              {String(h2Index).padStart(2, '0')}
            </span>
            <span>{children}</span>
          </h2>
        )
      },
      upload: ({ node }) => {
        const asset = mapMedia(node.value as Media | number)
        if (asset?.kind !== 'image') return null
        const caption = (node.value as Media).caption
        return (
          <figure className="prose__figure">
            <Picture asset={asset} sizes="(max-width: 768px) 100vw, 720px" />
            {caption && <figcaption>{caption}</figcaption>}
          </figure>
        )
      },
      blocks: {
        callout: ({ node }) => <Callout fields={node.fields as CalloutBlock} labels={labels} />,
        cta: ({ node }) => <Cta fields={node.fields as CtaBlock} />,
        faq: ({ node }) => <Faq fields={node.fields as FaqBlock} labels={labels} />,
      },
    }
  }

export const RichText = async ({ data, locale }: { data: LexicalDocument; locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'article' })
  const labels: Labels = { tip: t('tip'), note: t('note'), warning: t('warning'), faq: t('faq') }
  return (
    <LexicalRichText
      className="prose"
      converters={converters(locale, labels)}
      data={data as unknown as SerializedEditorState}
      disableContainer={false}
    />
  )
}
