import type { Locale } from '../domain/types'
import type { LexicalDocument, LexicalNode } from './lexical'

const NARROW_NBSP = ' '
const NBSP = ' '

/** French puts a non-breaking space before : ; ? ! and inside « », so a colon never starts a line. */
export const typesetFrench = (text: string): string =>
  text
    .replace(/ +([;?!])/g, `${NARROW_NBSP}$1`)
    .replace(/ +:(?=\s|$)/g, `${NBSP}:`)
    .replace(/« +/g, `«${NBSP}`)
    .replace(/ +»/g, `${NBSP}»`)

export const typeset = (text: string, locale: Locale): string => (locale === 'fr' ? typesetFrench(text) : text)

const typesetNode = (node: LexicalNode): LexicalNode => ({
  ...node,
  ...(typeof node.text === 'string' ? { text: typesetFrench(node.text) } : {}),
  ...(node.children ? { children: node.children.map(typesetNode) } : {}),
})

export const typesetDocument = (doc: LexicalDocument, locale: Locale): LexicalDocument =>
  locale === 'fr' ? { root: typesetNode(doc.root) } : doc
