import { GoogleGenAI } from '@google/genai'

/**
 * Thin wrapper around the Google GenAI SDK for Medibot.
 *
 * The Gemini API key lives ONLY on the backend (BACKEND_GEMINI_API_KEY) and is
 * never exposed to the browser. All model calls — including tool orchestration
 * and document analysis — run server-side so business rules and authorization
 * are always enforced around the model, never by it.
 */

let client: GoogleGenAI | null = null

export const GEMINI_MODEL = process.env.BACKEND_GEMINI_MODEL || 'gemini-2.5-flash'

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.BACKEND_GEMINI_API_KEY)
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.BACKEND_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('BACKEND_GEMINI_API_KEY is not configured')
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey })
  }
  return client
}
