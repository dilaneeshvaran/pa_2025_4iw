import { z } from 'zod'

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères')
    .trim(),
})

export type CreateTodoInput = z.infer<typeof createTodoSchema>
