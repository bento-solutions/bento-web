import { describe, expect, it } from 'vitest'

import { extractFaq, extractHeadings, headingId, readingMinutes } from '@/lib/lexical'
import { slugify } from '@/lib/slugify'
import { typesetFrench } from '@/lib/typography'
import { hreflangLinks, localizedPath } from '@/seo/hreflang'

describe('hreflang', () => {
  it('stays silent for a page that exists in one language', () => {
    expect(hreflangLinks({ fr: '/blog/x' }, 'https://bento212.com')).toBeUndefined()
  })

  it('links only the real translations, with French as the default', () => {
    expect(hreflangLinks({ fr: '/blog/x', en: '/en/blog/y' }, 'https://bento212.com')).toEqual({
      fr: 'https://bento212.com/blog/x',
      en: 'https://bento212.com/en/blog/y',
      'x-default': 'https://bento212.com/blog/x',
    })
  })

  it('percent-encodes Arabic paths', () => {
    const links = hreflangLinks({ fr: '/blog/x', ar: '/ar/blog/دفتر' }, 'https://bento212.com')
    expect(links?.ar).toBe('https://bento212.com/ar/blog/%D8%AF%D9%81%D8%AA%D8%B1')
  })

  it('gives French no prefix', () => {
    expect(localizedPath('fr', '/blog')).toBe('/blog')
    expect(localizedPath('ar', '/blog')).toBe('/ar/blog')
  })
})

describe('slugify', () => {
  it('drops French accents and punctuation', () => {
    expect(slugify('Tableur ou CRM : à quel moment faut-il changer ?')).toBe('tableur-ou-crm-a-quel-moment-faut-il-changer')
    expect(slugify('Cœur d’été')).toBe('coeur-d-ete')
  })

  it('keeps Arabic letters whole, including hamza forms', () => {
    expect(slugify('جدول بيانات أم CRM')).toBe('جدول-بيانات-أم-crm')
  })
})

describe('French typography', () => {
  it('keeps punctuation attached to the word before it', () => {
    expect(typesetFrench('CRM : à quel moment ?')).toBe('CRM : à quel moment ?')
    expect(typesetFrench('« Bonjour »')).toBe('« Bonjour »')
  })

  it('leaves times and URLs alone', () => {
    expect(typesetFrench('à 09:00 sur https://bento212.com')).toBe('à 09:00 sur https://bento212.com')
  })
})

describe('post body helpers', () => {
  const heading = (text: string) => ({ type: 'heading', tag: 'h2', children: [{ text }] })
  const doc = {
    root: {
      children: [
        heading('Première partie'),
        { type: 'paragraph', children: [{ text: 'mot '.repeat(660) }] },
        { type: 'heading', tag: 'h3', children: [{ text: 'Détail' }] },
        heading('Seconde partie'),
        {
          type: 'block',
          fields: { blockType: 'faq', items: [{ question: 'Pourquoi ?', answer: 'Parce que.' }] },
        },
      ],
    },
  }

  it('numbers only the H2s, with anchors the renderer can reproduce', () => {
    expect(extractHeadings(doc)).toEqual([
      { id: headingId('Première partie', 0), text: 'Première partie', number: '01' },
      { id: headingId('Seconde partie', 1), text: 'Seconde partie', number: '02' },
    ])
  })

  it('estimates reading time, never below one minute', () => {
    expect(readingMinutes(doc)).toBe(3)
    expect(readingMinutes({ root: { children: [] } })).toBe(1)
  })

  it('collects FAQ entries for structured data', () => {
    expect(extractFaq(doc)).toEqual([{ question: 'Pourquoi ?', answer: 'Parce que.' }])
  })
})
