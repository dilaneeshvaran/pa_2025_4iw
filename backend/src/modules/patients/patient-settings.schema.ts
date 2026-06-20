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
    return !isNaN(date.getTime()) && date < new Date()
  }, 'La date de naissance doit être dans le passé')

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
