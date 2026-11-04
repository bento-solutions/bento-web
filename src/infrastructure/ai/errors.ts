export type ProviderProblem = 'no-quota' | 'overloaded' | 'rate-limit' | 'bad-key' | 'other'

/** SDKs wrap the provider's message in layers of `cause`, so the whole chain has to be read. */
const chainText = (err: unknown): string => {
  const parts: string[] = []
  let current = err as { message?: unknown; status?: unknown; cause?: unknown } | undefined
  for (let depth = 0; current && depth < 5; depth += 1) {
    parts.push(`${String(current.status ?? '')} ${String(current.message ?? '')}`)
    current = current.cause as typeof current
  }
  return parts.join(' ')
}

export const classifyProviderError = (err: unknown): ProviderProblem => {
  const text = chainText(err)
  if (/limit: 0\b|upgrade your tier|insufficient[_ ]quota|credit balance/i.test(text)) return 'no-quota'
  if (/high demand|service_unavailable|overloaded|\b50[34]\b/i.test(text)) return 'overloaded'
  if (/rate limit|too_many_requests|\b429\b/i.test(text)) return 'rate-limit'
  if (/api[ _-]?key|unauthori[sz]ed|permission[ _]denied|\b401\b|\b403\b/i.test(text)) return 'bad-key'
  return 'other'
}

/** What the person in the admin reads. Written here, never copied from the provider's response. */
export const PROVIDER_MESSAGES: Record<ProviderProblem, string> = {
  'no-quota':
    'Votre clé d’API ne donne pas accès à ce modèle : l’offre gratuite de Google ne couvre pas la génération d’images. Un administrateur doit activer la facturation sur le projet de la clé.',
  overloaded: 'Le service d’IA est surchargé en ce moment. Réessayez dans quelques minutes.',
  'rate-limit': 'La limite du service d’IA est atteinte pour le moment. Réessayez dans une minute.',
  'bad-key': 'La clé d’API a été refusée. Un administrateur doit la vérifier.',
  other: 'Le service d’IA n’a pas répondu. Réessayez dans un instant.',
}
