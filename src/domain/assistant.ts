/**
 * The writing assistant's vocabulary. No framework or provider code here, so a provider can be
 * swapped by writing one adapter in infrastructure/ai.
 */
import type { Locale } from './types'

export const ASSISTANT_ACTIONS = ['outline', 'draft', 'titles', 'excerpt', 'meta', 'faq', 'proofread', 'translate'] as const
export type AssistantAction = (typeof ASSISTANT_ACTIONS)[number]

/** The post as it stands in the form, for the language being edited. */
export type AssistantBrief = {
  locale: Locale
  title?: string
  keyword?: string
  excerpt?: string
  bodyText?: string
  /** Extra direction from the author, in their own words. */
  note?: string
  /** For a translation: the language to translate into. */
  targetLocale?: Locale
}

export type TextRequest = { system: string; prompt: string; maxTokens: number }

export interface TextGenerator {
  readonly provider: string
  generate(request: TextRequest): Promise<string>
}

export type GeneratedImage = { data: Buffer; mimeType: string }

export interface ImageGenerator {
  readonly provider: string
  generate(prompt: string): Promise<GeneratedImage>
}

/** A provider declined or failed. The message is safe to show to the person using the admin. */
export class AssistantError extends Error {}
