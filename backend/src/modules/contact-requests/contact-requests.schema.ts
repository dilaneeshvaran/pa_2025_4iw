import { z } from 'zod'

export const createContactRequestSchema = z.object({
  requestType: z.enum(['DEMO', 'INFO', 'SUPPORT'], {
    message: 'Type de demande invalide',
  }),
  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string().email('Email invalide'),
  phone: z
    .string()
    .regex(
      /^\+?[0-9]{10,15}$/,
      'Numéro de téléphone invalide (format: +225XXXXXXXXXX)',
    ),
  postalCode: z
    .string()
    .min(2, 'Le code postal doit contenir au moins 2 caractères')
    .max(10, 'Le code postal ne peut pas dépasser 10 caractères'),
  specialty: z
    .string()
    .min(2, 'La spécialité doit contenir au moins 2 caractères')
    .max(100, 'La spécialité ne peut pas dépasser 100 caractères'),
})

export type CreateContactRequestInput = z.infer<
  typeof createContactRequestSchema
>
