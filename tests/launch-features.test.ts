import { describe, expect, it } from 'vitest'

import { buildImagePrompt, buildTextRequest, EDITORIAL_SYSTEM } from '@/assistant/prompts'
import { firstAdminGate } from '@/lib/first-admin-gate'
import type { LexicalDocument } from '@/lib/lexical'
import { mentionsKeyword, seoChecks } from '@/lib/seo-checklist'

const text = (value: string) => ({ type: 'text', text: value })
const body: LexicalDocument = {
  root: {
    children: [
      { type: 'paragraph', children: [text('Relancer une facture impayée sans abîmer la relation avec le client.')] },
      { type: 'heading', tag: 'h2', children: [text('Comment relancer une facture impayée')] },
      { type: 'heading', tag: 'h2', children: [text('Éviter les retards')] },
      {
        type: 'paragraph',
        children: [{ type: 'link', fields: { linkType: 'custom', url: '/blog/autre-article' }, children: [text('un autre article')] }],
      },
      { type: 'block', fields: { blockType: 'cta' } },
    ],
  },
}

const check = (id: string, input: Parameters<typeof seoChecks>[0]) => seoChecks(input).find((c) => c.id === id)?.ok

describe('SEO checklist', () => {
  it('matches keywords regardless of case and accents', () => {
    expect(mentionsKeyword('Facture IMPAYÉE : que faire ?', 'facture impayee')).toBe(true)
    expect(mentionsKeyword('Une facture réglée', 'facture impayee')).toBe(false)
    expect(mentionsKeyword('anything', '')).toBe(false)
  })

  it('checks the body and the fields the author filled in', () => {
    const input = {
      title: 'Relancer une facture impayée : la méthode',
      slug: 'relancer-facture-impayee',
      metaDescription: 'Une méthode simple pour relancer une facture impayée sans abîmer la relation avec votre client.',
      keyword: 'relancer facture impayée',
      hero: 12,
      body,
    }
    for (const id of ['keyword', 'title-keyword', 'title-length', 'description-length', 'description-keyword', 'slug', 'intro', 'headings', 'heading-keyword', 'internal-link', 'cta', 'cover', 'indexable']) {
      expect(check(id, input), id).toBe(true)
    }
    expect(check('length', input)).toBe(false)
  })

  it('flags what is missing on an empty post without throwing', () => {
    const checks = seoChecks({})
    expect(checks.filter((c) => c.ok).map((c) => c.id)).toEqual(['indexable'])
    expect(check('indexable', { noindex: true })).toBe(false)
  })
})

describe('first administrator gate', () => {
  const token = 'secret-token'
  const form = '/admin/create-first-user'
  const api = '/api/users/first-register'

  it('hides the form and its API from anyone without the link', () => {
    for (const pathname of [form, `${form}/`, api]) {
      expect(firstAdminGate({ pathname, token, cookie: undefined, param: null })).toBe('deny')
      expect(firstAdminGate({ pathname, token, cookie: 'wrong', param: 'wrong' })).toBe('deny')
    }
  })

  it('lets the private link through, then remembers it', () => {
    expect(firstAdminGate({ pathname: form, token, cookie: undefined, param: token })).toBe('unlock')
    expect(firstAdminGate({ pathname: api, token, cookie: token, param: null })).toBe('pass')
  })

  it('leaves every other page alone, and everything alone without a token', () => {
    expect(firstAdminGate({ pathname: '/admin', token, cookie: undefined, param: null })).toBe('pass')
    expect(firstAdminGate({ pathname: '/api/users/login', token, cookie: undefined, param: null })).toBe('pass')
    expect(firstAdminGate({ pathname: form, token: undefined, cookie: undefined, param: null })).toBe('pass')
  })
})

describe('assistant prompts', () => {
  it('always carries the rule against invented facts', () => {
    expect(EDITORIAL_SYSTEM).toContain('Never invent figures')
    expect(EDITORIAL_SYSTEM).toContain('[à vérifier]')
    expect(buildTextRequest('draft', { locale: 'fr', title: 'x' }).system).toBe(EDITORIAL_SYSTEM)
  })

  it('writes in the language being edited and translates into the one asked for', () => {
    expect(buildTextRequest('titles', { locale: 'ar', keyword: 'crm' }).prompt).toContain('Modern Standard Arabic')
    const translate = buildTextRequest('translate', { locale: 'fr', targetLocale: 'en', bodyText: 'Bonjour' })
    expect(translate.prompt).toContain('from French into English')
    expect(translate.prompt).toContain('Bonjour')
  })

  it('keeps every cover in the house style, without text', () => {
    const prompt = buildImagePrompt('un comptoir')
    expect(prompt).toContain('un comptoir')
    expect(prompt).toContain('#2B46B5')
    expect(prompt).toContain('Do not include any text')
  })
})
