import { z } from 'zod'

export const oauthCallbackQuerySchema = z.object({
  code: z.string().min(1, 'Le code OAuth est requis'),
  state: z.string().min(1, 'Le state OAuth est requis'),
})

export type OAuthCallbackQuery = z.infer<typeof oauthCallbackQuerySchema>

export const oauthErrorQuerySchema = z.object({
  error: z.string().optional(),
  error_description: z.string().optional(),
})

export type OAuthErrorQuery = z.infer<typeof oauthErrorQuerySchema>
