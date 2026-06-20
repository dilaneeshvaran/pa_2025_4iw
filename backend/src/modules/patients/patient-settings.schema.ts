import { z } from 'zod'

export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9\s\-()]+$/, 'Le numéro de téléphone contient des caractères non autorisés')
  .refine((val) => {
    const digits = val.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 15
  }, 'Le numéro de téléphone doit contenir entre 10 et 15 chiffres')

export const dateOfBirthSchema = z
  .string()
  .refine((val) => {
    const date = new Date(val)
    if (isNaN(date.getTime())) return false
    const now = new Date()
    const minDate = new Date(now.getFullYear() - 15, now.getMonth(), now.getDate())
    const maxDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate())
    return date <= minDate && date >= maxDate
  }, 'La date de naissance doit être valide (âge requis: 15 à 120 ans)')

export const updatePatientProfileSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').optional(),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: dateOfBirthSchema.optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
})

export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileSchema>
