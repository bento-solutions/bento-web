import type { PayloadRequest } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { assistantEndpoints, LIMITS, resetAssistantLimits } from '@/assistant/endpoints'
import { AssistantError, type ImageGenerator, type TextGenerator } from '@/domain/assistant'

const png = Buffer.from('fake-image')

const setup = (options: { text?: Partial<TextGenerator> | null; image?: Partial<ImageGenerator> | null } = {}) => {
  const generateText = vi.fn(async () => 'Un texte proposé.')
  const generateImage = vi.fn(async () => ({ data: png, mimeType: 'image/png' }))
  const text = options.text === null ? null : ({ provider: 'fake', generate: generateText, ...options.text } as TextGenerator)
  const image = options.image === null ? null : ({ provider: 'fake', generate: generateImage, ...options.image } as ImageGenerator)
  const endpoints = assistantEndpoints({ text: () => text, image: () => image })
  const create = vi.fn(async () => ({ id: 42, url: '/media/x.webp', sizes: { card: { url: '/media/x-card.webp' } } }))

  const call = async (path: string, body?: unknown, user: unknown = { id: 1, role: 'author' }) => {
    const endpoint = endpoints.find((e) => e.path === path)
    if (!endpoint) throw new Error(`no endpoint ${path}`)
    const req = {
      user,
      json: async () => body,
      payload: { create, logger: { error: vi.fn() }, config: {} },
    } as unknown as PayloadRequest
    const response = await endpoint.handler(req)
    return { status: response.status, body: (await response.json()) as Record<string, unknown> }
  }
  return { call, create, generateText, generateImage }
}

beforeEach(() => resetAssistantLimits())

describe('assistant endpoints', () => {
  it('refuses anyone who is not logged in, before spending anything', async () => {
    const { call, generateText, generateImage } = setup()
    for (const path of ['/assistant/status', '/assistant/text', '/assistant/lexical', '/assistant/image']) {
      expect((await call(path, { action: 'titles', title: 'x', subject: 's', alt: 'a' }, null)).status, path).toBe(401)
    }
    expect(generateText).not.toHaveBeenCalled()
    expect(generateImage).not.toHaveBeenCalled()
  })

  it('reports what is switched on, and says so when a key is missing', async () => {
    const on = setup()
    expect((await on.call('/assistant/status')).body).toEqual({ text: true, image: true })
    const off = setup({ text: null, image: null })
    expect((await off.call('/assistant/status')).body).toEqual({ text: false, image: false })
    expect((await off.call('/assistant/text', { action: 'titles', title: 'x' })).status).toBe(503)
    expect((await off.call('/assistant/image', { subject: 's', alt: 'a' })).status).toBe(503)
  })

  it('returns generated text and rejects requests with nothing to work on', async () => {
    const { call, generateText } = setup()
    const ok = await call('/assistant/text', { action: 'titles', keyword: 'crm', locale: 'fr' })
    expect(ok).toEqual({ status: 200, body: { text: 'Un texte proposé.' } })
    expect((await call('/assistant/text', { action: 'delete-everything', title: 'x' })).status).toBe(400)
    expect((await call('/assistant/text', { action: 'titles' })).status).toBe(400)
    expect((await call('/assistant/text', { action: 'proofread', title: 'x' })).status).toBe(400)
    expect((await call('/assistant/text', { action: 'translate', bodyText: 'x' })).status).toBe(400)
    expect(generateText).toHaveBeenCalledTimes(1)
  })

  it('caps long input before it reaches the provider', async () => {
    const { call, generateText } = setup()
    await call('/assistant/text', { action: 'proofread', bodyText: 'x'.repeat(LIMITS.bodyChars + 500) })
    const [request] = generateText.mock.calls[0] as unknown as [{ prompt: string }]
    expect(request.prompt.length).toBeLessThan(LIMITS.bodyChars + 2000)
  })

  it('stops at the hourly limit, per person', async () => {
    const { call } = setup()
    for (let i = 0; i < LIMITS.textPerHour; i += 1) {
      expect((await call('/assistant/text', { action: 'titles', title: 'x' })).status).toBe(200)
    }
    expect((await call('/assistant/text', { action: 'titles', title: 'x' })).status).toBe(429)
    expect((await call('/assistant/text', { action: 'titles', title: 'x' }, { id: 2 })).status).toBe(200)
  })

  it('shows a provider refusal as is, and hides other failures', async () => {
    const refused = setup({ text: { generate: async () => { throw new AssistantError('Le modèle a refusé cette demande.') } } })
    expect((await refused.call('/assistant/text', { action: 'titles', title: 'x' })).body.error).toBe('Le modèle a refusé cette demande.')
    const broken = setup({ text: { generate: async () => { throw new Error('secret key abc is invalid') } } })
    const result = await broken.call('/assistant/text', { action: 'titles', title: 'x' })
    expect(result.status).toBe(502)
    expect(String(result.body.error)).not.toContain('secret')
  })

  it('saves a generated cover as AI media, as the person asking, and requires alt text', async () => {
    const { call, create, generateImage } = setup()
    expect((await call('/assistant/image', { subject: 'un comptoir' })).status).toBe(400)
    expect(generateImage).not.toHaveBeenCalled()

    const result = await call('/assistant/image', { subject: 'Un comptoir à Casablanca', alt: 'Un comptoir', locale: 'fr' })
    expect(result).toEqual({ status: 200, body: { id: 42, url: '/media/x-card.webp' } })
    const [args] = create.mock.calls[0] as unknown as [Record<string, never>]
    expect(args).toMatchObject({ collection: 'media', overrideAccess: false, locale: 'fr', data: { alt: 'Un comptoir', source: 'ai' } })
    expect((args.file as unknown as { name: string }).name).toBe('un-comptoir-a-casablanca.png')
  })
})
