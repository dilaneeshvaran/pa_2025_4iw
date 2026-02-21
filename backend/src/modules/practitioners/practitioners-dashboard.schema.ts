import { z } from 'zod'

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères')
    .trim(),
})

export type CreateTodoInput = z.infer<typeof createTodoSchema>

export const updateBillingConfigSchema = z.object({
  baseConsultationFee: z.number().min(0).optional(),
  teleconsultationFee: z.number().min(0).nullable().optional(),
  emergencyFee: z.number().min(0).nullable().optional(),
  acceptedPaymentMethods: z
    .array(
      z.enum([
        'CARD',
        'MOBILE_MONEY',
        'PAYPAL',
        'CASH',
        'CHECK',
        'TRANSFER',
        'OTHER',
        'ONLINE',
      ]),
    )
    .optional(),
  bankInfo: z.record(z.string(), z.any()).nullable().optional(),
})

export type UpdateBillingConfigInput = z.infer<typeof updateBillingConfigSchema>
