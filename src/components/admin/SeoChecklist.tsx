'use client'

import { useAllFormFields, useTranslation } from '@payloadcms/ui'

import type { LexicalDocument } from '@/lib/lexical'
import { seoChecks } from '@/lib/seo-checklist'

/** Updates as the author types, for the language being edited. It advises and never blocks. */
export const SeoChecklist = () => {
  const [fields] = useAllFormFields()
  const { i18n } = useTranslation()
  const language = i18n.language === 'fr' ? 'fr' : 'en'
  const text = (path: string): string | null => (fields[path]?.value as string | null | undefined) ?? null

  const checks = seoChecks({
    title: text('title'),
    slug: text('slug'),
    metaTitle: text('meta.title'),
    metaDescription: text('meta.description'),
    keyword: text('targetKeyword'),
    hero: fields.hero?.value,
    noindex: fields['meta.noindex']?.value as boolean | undefined,
    body: fields.body?.value as LexicalDocument | undefined,
  })
  const done = checks.filter((check) => check.ok).length

  return (
    <section className="seo-checklist" aria-label="SEO">
      <header>
        <h3>{language === 'fr' ? 'Référencement' : 'SEO'}</h3>
        <span className="seo-checklist__score">
          {done}/{checks.length}
        </span>
      </header>
      <ul>
        {checks.map((check) => (
          <li key={check.id} data-ok={check.ok}>
            <span aria-hidden="true">{check.ok ? '✓' : '○'}</span>
            <span className="seo-checklist__label">
              <span className="seo-checklist__sr">
                {check.ok ? (language === 'fr' ? 'Fait : ' : 'Done: ') : language === 'fr' ? 'À faire : ' : 'To do: '}
              </span>
              {check.label[language]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
