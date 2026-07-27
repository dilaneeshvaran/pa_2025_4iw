const MARKER = /\[{1,2}\s*choix\s*:\s*([^\]]*)\]{1,2}/gi

const MAX_OPTIONS = 4
const MAX_OPTION_LENGTH = 32

const YES_NO = ['Oui', 'Non']

const BINARY_HINTS =
  /\b(est-ce que|souhaitez-vous|souhaites-tu|voulez-vous|veux-tu|voudriez-vous|voudrais-tu|puis-je|dois-je|confirmez-vous|confirmes-tu|acceptez-vous|acceptes-tu|avez-vous|as-tu|êtes-vous|es-tu|seriez-vous|serais-tu|d'accord|ça vous convient|cela vous convient|ça te convient)\b/i

const OPEN_HINTS =
  /\b(quel|quelle|quels|quelles|comment|quand|où|pourquoi|combien|qui|qu'est-ce|lequel|laquelle|décrivez|décris|précisez|précise|dites-moi|dis-moi)\b/i

export interface QuickRepliesExtraction {
  text: string
  options: string[]
}

function lastQuestion(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed.endsWith('?')) return null
  const sentences = trimmed
    .split(/(?<=[.!?\n])[ \t]+|\n+/)
    .filter((s) => s.trim().length > 0)
  const last = sentences[sentences.length - 1]?.trim()
  return last && last.endsWith('?') ? last : null
}

function detectYesNo(text: string): string[] {
  const question = lastQuestion(text)
  if (!question) return []
  if (/\boui\s+ou\s+non\b/i.test(question)) return [...YES_NO]
  if (OPEN_HINTS.test(question) || /\bou\b/i.test(question)) return []
  return BINARY_HINTS.test(question) ? [...YES_NO] : []
}

function normalizeOptions(raw: string): string[] {
  const seen = new Set<string>()
  const options: string[] = []
  for (const part of raw.split('|')) {
    const option = part
      .trim()
      .replace(/^[-•*\s]+/, '')
      .replace(/\s+/g, ' ')
    if (!option || option.length > MAX_OPTION_LENGTH) continue
    const key = option.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    options.push(option)
    if (options.length === MAX_OPTIONS) break
  }
  return options
}

export function extractQuickReplies(raw: string): QuickRepliesExtraction {
  const matches = [...raw.matchAll(MARKER)]
  const text = (matches.length > 0 ? raw.replace(MARKER, '') : raw)
    .replace(/\s+$/, '')
    .trim()

  const declared =
    matches.length > 0
      ? normalizeOptions(matches[matches.length - 1]![1] ?? '')
      : []
  const options = declared.length >= 2 ? declared : detectYesNo(text)

  return { text, options }
}
