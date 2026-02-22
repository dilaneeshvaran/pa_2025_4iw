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

export const updatePractitionerProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().nullable().optional(),
  languages: z.array(z.string()).optional(),
  photoUrl: z.string().nullable().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().optional(),
  qualifications: z
    .array(
      z.object({
        title: z.string(),
        institution: z.string(),
        yearObtained: z.number(),
      }),
    )
    .optional(),
})

export type UpdatePractitionerProfileInput = z.infer<
  typeof updatePractitionerProfileSchema
>
