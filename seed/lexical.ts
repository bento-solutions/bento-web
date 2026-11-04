/** Tiny builders for Lexical JSON, so the sample articles read like text. */
import { randomBytes } from 'crypto'

type Dir = 'ltr' | 'rtl'
export type Node = Record<string, unknown>

const text = (value: string, format = 0): Node => ({
  type: 'text',
  version: 1,
  text: value,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
})

const link = (label: string, url: string): Node => ({
  type: 'link',
  version: 3,
  direction: 'ltr',
  format: '',
  indent: 0,
  fields: { linkType: 'custom', url, newTab: false },
  children: [text(label)],
})

/** Supports **bold**, *italic* and [label](url). */
const inline = (source: string): Node[] =>
  source
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g)
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('**')) return text(part.slice(2, -2), 1)
      if (part.startsWith('*')) return text(part.slice(1, -1), 2)
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      return match ? link(match[1], match[2]) : text(part)
    })

const element = (type: string, children: Node[], extra: Node = {}, direction: Dir = 'ltr'): Node => ({
  type,
  version: 1,
  direction,
  format: '',
  indent: 0,
  children,
  ...extra,
})

export const builders = (direction: Dir = 'ltr') => ({
  p: (value: string) => element('paragraph', inline(value), { textFormat: 0, textStyle: '' }, direction),
  h2: (value: string) => element('heading', inline(value), { tag: 'h2' }, direction),
  h3: (value: string) => element('heading', inline(value), { tag: 'h3' }, direction),
  quote: (value: string) => element('quote', inline(value), {}, direction),
  ul: (items: string[]) =>
    element(
      'list',
      items.map((item, index) => element('listitem', inline(item), { value: index + 1, checked: undefined }, direction)),
      { listType: 'bullet', start: 1, tag: 'ul' },
      direction,
    ),
  ol: (items: string[]) =>
    element(
      'list',
      items.map((item, index) => element('listitem', inline(item), { value: index + 1, checked: undefined }, direction)),
      { listType: 'number', start: 1, tag: 'ol' },
      direction,
    ),
  table: (rows: string[][]) =>
    element(
      'table',
      rows.map((row, rowIndex) =>
        element(
          'tablerow',
          row.map((cell) =>
            element(
              'tablecell',
              [element('paragraph', inline(cell), { textFormat: 0, textStyle: '' }, direction)],
              { colSpan: 1, rowSpan: 1, headerState: rowIndex === 0 ? 1 : 0, backgroundColor: null },
              direction,
            ),
          ),
          {},
          direction,
        ),
      ),
      {},
      direction,
    ),
  block: (blockType: string, fields: Node): Node => ({
    type: 'block',
    version: 2,
    format: '',
    fields: { id: randomBytes(12).toString('hex'), blockName: '', blockType, ...fields },
  }),
  doc: (...children: Node[]) => ({
    root: { type: 'root', version: 1, direction, format: '', indent: 0, children },
  }),
})
