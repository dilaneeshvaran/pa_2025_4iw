import { z } from 'zod'

export const delaySessionSchema = z.object({
  delay: z.number().int().min(1).max(120),
})

export const cancelSessionSchema = z.object({
  reason: z.string().optional(),
})

export type DelaySessionInput = z.infer<typeof delaySessionSchema>
export type CancelSessionInput = z.infer<typeof cancelSessionSchema>
