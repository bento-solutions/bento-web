/** The checks behind the SEO panel in the admin. Advice only: nothing here blocks publishing. */
import { extractHeadings, type LexicalDocument, type LexicalNode, nodeText } from './lexical'

export type SeoInput = {
  title?: string | null
  slug?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  keyword?: string | null
  hero?: unknown
  noindex?: boolean | null
  body?: LexicalDocument | null
}

export type SeoCheck = {
  id: string
  ok: boolean
  label: { fr: string; en: string }
}

const STOP_WORDS = new Set(
  'a au aux avec ce ces dans de des du en et faut il la le les ou par pour que qui sur un une vos votre the of to for and in on an'.split(
    ' ',
  ),
)

const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()

const wordsOf = (text: string): string[] => normalize(text).split(/[^\p{L}\p{N}]+/u).filter(Boolean)

const significant = (keyword: string): string[] => wordsOf(keyword).filter((word) => !STOP_WORDS.has(word))

/** Readers and Google both tolerate word order and small gaps, so most of the words are enough. */
export const mentionsKeyword = (text: string | null | undefined, keyword: string | null | undefined): boolean => {
  const wanted = significant(keyword ?? '')
  if (!wanted.length || !text) return false
  const words = new Set(wordsOf(text))
  const found = wanted.filter((word) => words.has(word)).length
  return wanted.length <= 2 ? found === wanted.length : found / wanted.length >= 0.6
}

const walk = (node: LexicalNode | undefined, visit: (n: LexicalNode) => void): void => {
  if (!node) return
  visit(node)
  node.children?.forEach((child) => walk(child, visit))
}

const firstParagraph = (doc: SeoInput['body']): string => {
  const node = doc?.root?.children?.find((n) => n.type === 'paragraph' && nodeText(n).trim())
  return node ? nodeText(node) : ''
}

const wordCount = (doc: SeoInput['body']): number => {
  let text = ''
  walk(doc?.root, (n) => {
    if (n.text) text += `${n.text} `
  })
  return text.split(/\s+/).filter(Boolean).length
}

const hasInternalLink = (doc: SeoInput['body']): boolean => {
  let found = false
  walk(doc?.root, (n) => {
    if (n.type !== 'link' && n.type !== 'autolink') return
    const fields = (n.fields ?? {}) as { linkType?: string; url?: string }
    if (fields.linkType === 'internal' || fields.url?.startsWith('/') || fields.url?.includes('bento212.com')) found = true
  })
  return found
}

const hasBlock = (doc: SeoInput['body'], blockType: string): boolean => {
  let found = false
  walk(doc?.root, (n) => {
    if (n.type === 'block' && n.fields?.blockType === blockType) found = true
  })
  return found
}

export const META_DESCRIPTION_MIN = 50
export const META_DESCRIPTION_MAX = 160

const between = (value: number, min: number, max: number): boolean => value >= min && value <= max

export const seoChecks = (input: SeoInput): SeoCheck[] => {
  const title = input.title?.trim() ?? ''
  const metaTitle = input.metaTitle?.trim() || title
  const description = input.metaDescription?.trim() ?? ''
  const slug = input.slug?.trim() ?? ''
  const keyword = input.keyword?.trim() ?? ''
  const headings = extractHeadings(input.body)
  const words = wordCount(input.body)

  return [
    {
      id: 'keyword',
      ok: significant(keyword).length > 0,
      label: { fr: 'Mot-clé visé renseigné (onglet Stratégie)', en: 'Target keyword set (Strategy tab)' },
    },
    {
      id: 'title-length',
      ok: between(title.length, 20, 65),
      label: { fr: `Titre de 20 à 65 caractères (${title.length})`, en: `Title of 20 to 65 characters (${title.length})` },
    },
    {
      id: 'title-keyword',
      ok: mentionsKeyword(title, keyword),
      label: { fr: 'Le mot-clé figure dans le titre', en: 'The keyword is in the title' },
    },
    {
      id: 'meta-title',
      ok: between(metaTitle.length, 1, 60),
      label: {
        fr: `Titre pour Google de 60 caractères maximum (${metaTitle.length})`,
        en: `Google title of at most 60 characters (${metaTitle.length})`,
      },
    },
    {
      id: 'description-length',
      // The same limits the review step enforces (META_DESCRIPTION_MIN and MAX in hooks/postWorkflow.ts).
      ok: between(description.length, META_DESCRIPTION_MIN, META_DESCRIPTION_MAX),
      label: {
        fr: `Description Google de ${META_DESCRIPTION_MIN} à ${META_DESCRIPTION_MAX} caractères (${description.length})`,
        en: `Google description of ${META_DESCRIPTION_MIN} to ${META_DESCRIPTION_MAX} characters (${description.length})`,
      },
    },
    {
      id: 'description-keyword',
      ok: mentionsKeyword(description, keyword),
      label: { fr: 'Le mot-clé figure dans la description', en: 'The keyword is in the description' },
    },
    {
      id: 'slug',
      ok: between(slug.length, 1, 75) && mentionsKeyword(slug, keyword),
      label: { fr: 'Adresse courte, avec le mot-clé', en: 'Short URL containing the keyword' },
    },
    {
      id: 'intro',
      ok: mentionsKeyword(firstParagraph(input.body), keyword),
      label: { fr: 'Le mot-clé apparaît dès le premier paragraphe', en: 'The keyword appears in the first paragraph' },
    },
    {
      id: 'length',
      ok: words >= 500,
      label: { fr: `Au moins 500 mots (${words})`, en: `At least 500 words (${words})` },
    },
    {
      id: 'headings',
      ok: headings.length >= 2,
      label: { fr: `Au moins deux intertitres H2 (${headings.length})`, en: `At least two H2 headings (${headings.length})` },
    },
    {
      id: 'heading-keyword',
      ok: headings.some((heading) => mentionsKeyword(heading.text, keyword)),
      label: { fr: 'Le mot-clé figure dans un intertitre', en: 'The keyword is in a heading' },
    },
    {
      id: 'internal-link',
      ok: hasInternalLink(input.body),
      label: { fr: 'Au moins un lien vers un autre article', en: 'At least one link to another post' },
    },
    {
      id: 'cta',
      ok: hasBlock(input.body, 'cta'),
      label: { fr: 'Un appel à l’action vers un produit', en: 'A call to action towards a product' },
    },
    {
      id: 'cover',
      ok: Boolean(input.hero),
      label: { fr: 'Une couverture', en: 'A cover' },
    },
    {
      id: 'indexable',
      ok: !input.noindex,
      label: { fr: 'Visible par Google', en: 'Visible to Google' },
    },
  ]
}
