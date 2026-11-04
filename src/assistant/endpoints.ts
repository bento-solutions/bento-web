import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { Endpoint, PayloadRequest } from 'payload'

import {
  ASSISTANT_ACTIONS,
  type AssistantAction,
  type AssistantBrief,
  AssistantError,
  type ImageGenerator,
  type TextGenerator,
} from '@/domain/assistant'
import type { Locale } from '@/domain/types'
import { imageGenerator, textGenerator } from '@/infrastructure/ai'
import { slugify } from '@/lib/slugify'

import { buildImagePrompt, buildTextRequest } from './prompts'

export const LIMITS = { textPerHour: 40, imagesPerHour: 10, bodyChars: 60_000, noteChars: 1_000, subjectChars: 600 }

const HOUR = 60 * 60 * 1000
const usage = new Map<string, number[]>()

/** Stops a stuck tab or a shared login from running up the bill. Per process, which is enough here. */
const withinLimit = (key: string, limit: number, now = Date.now()): boolean => {
  const recent = (usage.get(key) ?? []).filter((time) => now - time < HOUR)
  if (recent.length >= limit) {
    usage.set(key, recent)
    return false
  }
  usage.set(key, [...recent, now])
  return true
}

export const resetAssistantLimits = (): void => usage.clear()

const json = (body: unknown, status = 200): Response => Response.json(body, { status })

const readBody = async (req: PayloadRequest): Promise<Record<string, unknown>> => {
  try {
    return ((await req.json?.()) ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}

const str = (value: unknown, max: number): string | undefined =>
  typeof value === 'string' && value.trim() ? value.slice(0, max) : undefined

const isLocale = (value: unknown): value is Locale => value === 'fr' || value === 'en' || value === 'ar'

const failure = (req: PayloadRequest, err: unknown): Response => {
  if (err instanceof AssistantError) return json({ error: err.message }, 502)
  req.payload.logger.error({ err }, 'Assistant request failed')
  return json({ error: 'Le service d’IA n’a pas répondu. Réessayez dans un instant.' }, 502)
}

/** Generators are passed in so tests never call a paid API. */
export const assistantEndpoints = (
  providers: { text: () => TextGenerator | null; image: () => ImageGenerator | null } = {
    text: textGenerator,
    image: imageGenerator,
  },
): Endpoint[] => [
  {
    path: '/assistant/status',
    method: 'get',
    handler: (req) => {
      if (!req.user) return json({ error: 'Connexion requise.' }, 401)
      return json({ text: Boolean(providers.text()), image: Boolean(providers.image()) })
    },
  },
  {
    path: '/assistant/text',
    method: 'post',
    handler: async (req) => {
      if (!req.user) return json({ error: 'Connexion requise.' }, 401)
      const generator = providers.text()
      if (!generator) return json({ error: 'L’assistant n’est pas activé sur ce serveur.' }, 503)

      const input = await readBody(req)
      const action = input.action as AssistantAction
      if (!ASSISTANT_ACTIONS.includes(action)) return json({ error: 'Action inconnue.' }, 400)
      const locale = isLocale(input.locale) ? input.locale : 'fr'
      const brief: AssistantBrief = {
        locale,
        title: str(input.title, 300),
        keyword: str(input.keyword, 200),
        excerpt: str(input.excerpt, 500),
        bodyText: str(input.bodyText, LIMITS.bodyChars),
        note: str(input.note, LIMITS.noteChars),
        targetLocale: isLocale(input.targetLocale) ? input.targetLocale : undefined,
      }
      if (action === 'translate' && !(brief.targetLocale && brief.bodyText)) {
        return json({ error: 'Écrivez d’abord l’article, puis choisissez la langue de traduction.' }, 400)
      }
      if (action === 'proofread' && !brief.bodyText) {
        return json({ error: 'L’article est encore vide : il n’y a rien à relire.' }, 400)
      }
      if (!brief.title && !brief.keyword && !brief.note && !brief.bodyText) {
        return json({ error: 'Donnez au moins un titre, un mot-clé ou une consigne.' }, 400)
      }
      if (!withinLimit(`text:${req.user.id}`, LIMITS.textPerHour)) {
        return json({ error: 'Limite atteinte pour cette heure. Réessayez plus tard.' }, 429)
      }

      try {
        const text = await generator.generate(buildTextRequest(action, brief))
        return json({ text })
      } catch (err) {
        return failure(req, err)
      }
    },
  },
  {
    // Turns Markdown into the editor's format, so a draft lands in the article with its headings and lists.
    path: '/assistant/lexical',
    method: 'post',
    handler: async (req) => {
      if (!req.user) return json({ error: 'Connexion requise.' }, 401)
      const input = await readBody(req)
      const markdown = str(input.markdown, LIMITS.bodyChars)
      if (!markdown) return json({ error: 'Texte vide.' }, 400)
      const editorConfig = await editorConfigFactory.default({ config: req.payload.config })
      return json({ value: convertMarkdownToLexical({ editorConfig, markdown }) })
    },
  },
  {
    path: '/assistant/image',
    method: 'post',
    handler: async (req) => {
      if (!req.user) return json({ error: 'Connexion requise.' }, 401)
      const generator = providers.image()
      if (!generator) return json({ error: 'La génération d’images n’est pas activée sur ce serveur.' }, 503)

      const input = await readBody(req)
      const subject = str(input.subject, LIMITS.subjectChars)
      const alt = str(input.alt, 300)
      if (!subject || !alt) return json({ error: 'Décrivez l’image et renseignez son texte alternatif.' }, 400)
      const locale = isLocale(input.locale) ? input.locale : 'fr'
      if (!withinLimit(`image:${req.user.id}`, LIMITS.imagesPerHour)) {
        return json({ error: 'Limite d’images atteinte pour cette heure. Réessayez plus tard.' }, 429)
      }

      try {
        const image = await generator.generate(buildImagePrompt(subject))
        const extension = image.mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
        const media = await req.payload.create({
          collection: 'media',
          locale,
          req,
          overrideAccess: false,
          data: { alt, source: 'ai' },
          file: {
            data: image.data,
            mimetype: image.mimeType,
            name: `${slugify(subject).slice(0, 60) || 'couverture'}.${extension}`,
            size: image.data.length,
          },
        })
        return json({ id: media.id, url: media.sizes?.card?.url ?? media.url })
      } catch (err) {
        return failure(req, err)
      }
    },
  },
]
