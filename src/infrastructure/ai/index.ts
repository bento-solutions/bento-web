import { AssistantError, type GeneratedImage, type ImageGenerator, type TextGenerator, type TextRequest } from '@/domain/assistant'

const TIMEOUT_MS = 120_000

/** Claude. Refused requests are re-run on another model by the API, then reported if still refused. */
export const anthropicText = (apiKey: string): TextGenerator => ({
  provider: 'anthropic',
  async generate({ system, prompt, maxTokens }: TextRequest) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS })
    const message = await client.beta.messages
      .stream({
        model: process.env.AI_TEXT_MODEL || 'claude-opus-5-5',
        // Thinking shares this budget, so the task's limit gets room on top of it.
        max_tokens: maxTokens + 8000,
        output_config: { effort: 'medium' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system,
        messages: [{ role: 'user', content: prompt }],
      } as never)
      .finalMessage()

    if (message.stop_reason === 'refusal') throw new AssistantError('Le modèle a refusé cette demande.')
    const text = message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('')
    if (!text.trim()) throw new AssistantError('Le modèle n’a rien renvoyé. Réessayez.')
    return text.trim()
  },
})

export const geminiText = (apiKey: string): TextGenerator => ({
  provider: 'gemini',
  async generate({ system, prompt }: TextRequest) {
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey })
    const interaction = await ai.interactions.create({
      model: process.env.AI_GEMINI_TEXT_MODEL || 'gemini-3.8-flash',
      system_instruction: system,
      input: prompt,
    })
    const text = interaction.output_text?.trim()
    if (!text) throw new AssistantError('Le modèle n’a rien renvoyé. Réessayez.')
    return text
  },
})

/** Nano Banana, Google's image model. */
export const geminiImage = (apiKey: string): ImageGenerator => ({
  provider: 'gemini',
  async generate(prompt: string): Promise<GeneratedImage> {
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey })
    const interaction = await ai.interactions.create({
      model: process.env.AI_IMAGE_MODEL || 'gemini-nano-banana-2.1',
      input: prompt,
      response_format: { type: 'image', aspect_ratio: '16:9' },
    })
    const image = interaction.output_image
    if (!image?.data) throw new AssistantError('Aucune image n’a été générée. Essayez une autre description.')
    return { data: Buffer.from(image.data, 'base64'), mimeType: image.mime_type || 'image/png' }
  },
})

/** Whichever key is set decides what is available. Without any, the assistant says it is switched off. */
export const textGenerator = (): TextGenerator | null => {
  if (process.env.ANTHROPIC_API_KEY) return anthropicText(process.env.ANTHROPIC_API_KEY)
  if (process.env.GEMINI_API_KEY) return geminiText(process.env.GEMINI_API_KEY)
  return null
}

export const imageGenerator = (): ImageGenerator | null =>
  process.env.GEMINI_API_KEY ? geminiImage(process.env.GEMINI_API_KEY) : null
