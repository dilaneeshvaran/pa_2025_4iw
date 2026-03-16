import { z } from 'zod'

// shared by practitioner and cabinet requests
const baseContactFields = {
  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string().trim().toLowerCase().email('Email invalide'),
  phone: z
    .string()
    .regex(
      /^\+?[0-9]{10,15}$/,
      'Numéro de téléphone invalide (format: +225XXXXXXXXXX)',
    ),
}

export const createPractitionerRequestSchema = z.object({
  ...baseContactFields,
  requestType: z.literal('PRACTITIONER'),
  orderNumber: z
    .string()
    .min(2, "Le numéro d'inscription à l'Ordre est requis")
    .max(50),
  specialty: z.string().max(100).optional(),
  clinicAddress: z.string().min(5, "L'adresse du cabinet est requise").max(255),
})

export const createCabinetRequestSchema = z.object({
  ...baseContactFields,
  requestType: z.literal('CABINET'),
  cabinetName: z.string().min(2, 'Le nom du cabinet est requis').max(200),
  cabinetAddress: z
    .string()
    .min(5, "L'adresse du cabinet est requise")
    .max(255),
  adminContactName: z
    .string()
    .min(2, 'Le nom du responsable administratif est requis')
    .max(100),
  adminContactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("L'email du responsable est invalide"),
  adminContactPhone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, 'Numéro du responsable invalide'),
})

export const createContactRequestSchema = z.object({
  requestType: z.enum(['DEMO', 'INFO', 'SUPPORT'], {
    message: 'Type de demande invalide',
  }),
  ...baseContactFields,
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
export type CreatePractitionerRequestInput = z.infer<
  typeof createPractitionerRequestSchema
>
export type CreateCabinetRequestInput = z.infer<
  typeof createCabinetRequestSchema
>
