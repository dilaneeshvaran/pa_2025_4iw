import { z } from 'zod'

export const medibotMessageSchema = z.object({
  message: z.string().min(1, 'Message vide').max(4000, 'Message trop long'),
  sessionId: z.string().max(64).optional(),
  conversationId: z.string().max(64).optional(),
})

export const medibotLinkSchema = z.object({
  sessionId: z.string().min(1).max(64),
})

export type MedibotMessageInput = z.infer<typeof medibotMessageSchema>
export type MedibotLinkInput = z.infer<typeof medibotLinkSchema>
