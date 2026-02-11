import { z } from 'zod'

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Le message ne peut pas être vide')
    .max(5000, 'Le message est trop long (max 5000 caractères)'),
})

export const getMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
})

export const startConversationSchema = z.object({
  practitionerId: z.string().min(1, 'ID du praticien requis'),
  content: z
    .string()
    .min(1, 'Le message ne peut pas être vide')
    .max(5000, 'Le message est trop long (max 5000 caractères)'),
})
