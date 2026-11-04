'use client'

import { Button, useAllFormFields, useConfig, useForm, useLocale } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import type { AssistantAction } from '@/domain/assistant'
import { type LexicalDocument, type LexicalNode, nodeText } from '@/lib/lexical'

type Applies = { path: string; label: string }

const ACTIONS: { action: AssistantAction; label: string; applies?: Applies }[] = [
  { action: 'outline', label: 'Proposer un plan' },
  { action: 'draft', label: 'Écrire un premier jet' },
  { action: 'titles', label: 'Proposer des titres' },
  { action: 'excerpt', label: 'Écrire le chapô', applies: { path: 'excerpt', label: 'Utiliser comme chapô' } },
  { action: 'meta', label: 'Écrire la description Google', applies: { path: 'meta.description', label: 'Utiliser comme description' } },
  { action: 'faq', label: 'Proposer une FAQ' },
  { action: 'proofread', label: 'Relire et lister les faits à vérifier' },
]

const LANGUAGES = [
  { code: 'en', label: 'anglais' },
  { code: 'ar', label: 'arabe' },
  { code: 'fr', label: 'français' },
]

/** Plain text of the article, block by block, so the model sees the structure without the JSON. */
const bodyToText = (doc: LexicalDocument | undefined): string =>
  (doc?.root?.children ?? [])
    .map((node: LexicalNode) => {
      const text = nodeText(node).trim()
      return node.type === 'heading' && text ? `## ${text}` : text
    })
    .filter(Boolean)
    .join('\n\n')

const post = async (path: string, body: unknown): Promise<Record<string, unknown>> => {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) throw new Error(String(result.error ?? 'La demande a échoué.'))
  return result
}

/**
 * Helps write, never publishes. Whatever it produces lands in the form as a draft, and using any of it
 * ticks "Written with AI assistance", so an editor knows what to check.
 */
export const AssistantPanel = () => {
  const [fields] = useAllFormFields()
  const { dispatchFields, setModified } = useForm()
  const { code: locale } = useLocale()
  const { config } = useConfig()
  const api = `${config.routes.api}/assistant`

  const [status, setStatus] = useState<{ text: boolean; image: boolean } | null>(null)
  const [note, setNote] = useState('')
  const [target, setTarget] = useState('en')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<{ text: string; applies?: Applies; markdown: boolean } | null>(null)
  const [subject, setSubject] = useState('')
  const [alt, setAlt] = useState('')
  const [cover, setCover] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${api}/status`, { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : { text: false, image: false }))
      .then(setStatus)
      .catch(() => setStatus({ text: false, image: false }))
  }, [api])

  const value = (path: string) => fields[path]?.value as string | undefined

  const setField = (path: string, next: unknown, resetEditor = false) => {
    dispatchFields({ type: 'UPDATE', path, value: next, ...(resetEditor ? { initialValue: next } : {}) } as never)
    dispatchFields({ type: 'UPDATE', path: 'aiAssisted', value: true } as never)
    setModified(true)
  }

  const run = async (name: string, work: () => Promise<void>) => {
    setBusy(name)
    setError(null)
    try {
      await work()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La demande a échoué.')
    } finally {
      setBusy(null)
    }
  }

  const generate = (action: AssistantAction, applies?: Applies) =>
    run(action, async () => {
      const { text } = await post(`${api}/text`, {
        action,
        locale,
        title: value('title'),
        keyword: value('targetKeyword'),
        excerpt: value('excerpt'),
        bodyText: bodyToText(fields.body?.value as LexicalDocument | undefined),
        note,
        targetLocale: action === 'translate' ? target : undefined,
      })
      setOutput({ text: String(text), applies, markdown: action === 'draft' || action === 'translate' })
    })

  const insertInArticle = (markdown: string) => {
    const current = bodyToText(fields.body?.value as LexicalDocument | undefined)
    if (current && !window.confirm('Remplacer tout le texte actuel ? L’ancienne version reste dans l’onglet Versions une fois enregistrée.')) return
    return run('insert', async () => {
      const { value: lexical } = await post(`${api}/lexical`, { markdown })
      setField('body', lexical, true)
    })
  }

  const generateCover = () =>
    run('image', async () => {
      const { id, url } = await post(`${api}/image`, { subject, alt, locale })
      setField('hero', id)
      setCover(String(url))
    })

  if (!status) return null

  return (
    <section className="assistant-panel">
      <p className="assistant-panel__rule">
        L’assistant propose, vous décidez. Il peut se tromper : vérifiez chaque fait, chiffre et référence légale avant
        de soumettre l’article. Il ne publie jamais rien.
      </p>

      {!status.text && !status.image && (
        <p className="assistant-panel__off">
          L’assistant n’est pas activé sur ce serveur. Un administrateur doit ajouter une clé d’API (voir le README).
        </p>
      )}

      {status.text && (
        <>
          <label className="assistant-panel__field">
            <span>Consigne (facultatif)</span>
            <textarea
              rows={3}
              value={note}
              maxLength={1000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Par exemple : pour un garage à Casablanca, avec un exemple de relance sur WhatsApp."
            />
          </label>

          <div className="assistant-panel__actions">
            {ACTIONS.map(({ action, label, applies }) => (
              <Button key={action} buttonStyle="secondary" size="small" disabled={Boolean(busy)} onClick={() => generate(action, applies)}>
                {busy === action ? 'En cours…' : label}
              </Button>
            ))}
          </div>

          <div className="assistant-panel__translate">
            <label>
              <span>Traduire vers</span>
              <select value={target} onChange={(event) => setTarget(event.target.value)}>
                {LANGUAGES.filter(({ code }) => code !== locale).map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Button buttonStyle="secondary" size="small" disabled={Boolean(busy)} onClick={() => generate('translate')}>
              {busy === 'translate' ? 'En cours…' : 'Traduire l’article'}
            </Button>
          </div>
        </>
      )}

      {error && (
        <p className="assistant-panel__error" role="alert">
          {error}
        </p>
      )}

      {output && (
        <div className="assistant-panel__output">
          <pre>{output.text}</pre>
          <div className="assistant-panel__actions">
            {output.applies && (
              <Button size="small" onClick={() => setField((output.applies as Applies).path, output.text)}>
                {output.applies.label}
              </Button>
            )}
            {output.markdown && (
              <Button size="small" disabled={Boolean(busy)} onClick={() => insertInArticle(output.text)}>
                {busy === 'insert' ? 'En cours…' : 'Remplacer le corps de l’article'}
              </Button>
            )}
            <Button buttonStyle="secondary" size="small" onClick={() => navigator.clipboard.writeText(output.text)}>
              Copier
            </Button>
          </div>
        </div>
      )}

      {status.image && (
        <div className="assistant-panel__image">
          <h3>Générer une couverture</h3>
          <label className="assistant-panel__field">
            <span>Ce que l’image doit montrer</span>
            <input value={subject} maxLength={600} onChange={(event) => setSubject(event.target.value)} placeholder="Un comptoir de pièces auto avec une facture posée dessus" />
          </label>
          <label className="assistant-panel__field">
            <span>Texte alternatif</span>
            <input value={alt} maxLength={300} onChange={(event) => setAlt(event.target.value)} placeholder="Une facture posée sur un comptoir" />
          </label>
          <Button buttonStyle="secondary" size="small" disabled={Boolean(busy) || !subject || !alt} onClick={generateCover}>
            {busy === 'image' ? 'En cours…' : 'Générer et utiliser comme couverture'}
          </Button>
          {/* eslint-disable-next-line @next/next/no-img-element -- an admin preview of a file that was just created */}
          {cover && <img src={cover} alt={alt} />}
        </div>
      )}
    </section>
  )
}
