/** Small read-only helpers over the Lexical JSON stored in post bodies. */
import { slugify } from './slugify'

export type LexicalNode = {
  type?: string
  tag?: string
  text?: string
  children?: LexicalNode[]
  fields?: Record<string, unknown>
  [key: string]: unknown
}

export type LexicalDocument = { root: LexicalNode }

export const nodeText = (node: LexicalNode): string =>
  node.text ?? (node.children ?? []).map(nodeText).join('')

const walk = (node: LexicalNode, visit: (n: LexicalNode) => void): void => {
  visit(node)
  node.children?.forEach((child) => walk(child, visit))
}

const WORDS_PER_MINUTE = 220

export const readingMinutes = (doc: LexicalDocument | null | undefined): number => {
  if (!doc?.root) return 1
  let text = ''
  walk(doc.root, (n) => {
    if (n.text) text += `${n.text} `
    if (n.type === 'block') text += `${JSON.stringify(n.fields ?? {})} `
  })
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

export type Heading = { id: string; text: string; number: string }

/** Stable anchors for the top-level H2s. The table of contents and the renderer both use this. */
export const headingId = (text: string, index: number): string =>
  `${index + 1}-${slugify(text)}`.slice(0, 80)

export const extractHeadings = (doc: LexicalDocument | null | undefined): Heading[] => {
  const nodes = doc?.root?.children ?? []
  return nodes
    .filter((n) => n.type === 'heading' && n.tag === 'h2')
    .map((n, i) => {
      const text = nodeText(n)
      return { id: headingId(text, i), text, number: String(i + 1).padStart(2, '0') }
    })
}

export type FaqEntry = { question: string; answer: string }

export const extractFaq = (doc: LexicalDocument | null | undefined): FaqEntry[] => {
  const entries: FaqEntry[] = []
  if (!doc?.root) return entries
  walk(doc.root, (n) => {
    if (n.type === 'block' && n.fields?.blockType === 'faq') {
      const items = (n.fields.items ?? []) as { question?: string; answer?: string }[]
      items.forEach((item) => {
        if (item.question && item.answer) entries.push({ question: item.question, answer: item.answer })
      })
    }
  })
  return entries
}
