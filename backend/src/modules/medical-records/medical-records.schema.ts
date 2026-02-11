import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  bloodType: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
})

export const updateAntecedentsSchema = z.object({
  allergies: z.array(z.string().min(1)).optional(),
  chronicConditions: z.array(z.string().min(1)).optional(),
  surgicalOperations: z.array(z.string().min(1)).optional(),
})

export const createVaccinationSchema = z.object({
  vaccineName: z.string().min(1, 'Le nom du vaccin est requis'),
  vaccineType: z.string().optional(),
  manufacturer: z.string().optional(),
  batchNumber: z.string().optional(),
  doseNumber: z.number().int().positive().optional(),
  administeredAt: z.string().min(1, 'La date est requise'),
  administeredBy: z.string().optional(),
  location: z.string().optional(),
  nextDoseDate: z.string().optional(),
  sideEffects: z.string().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpdateAntecedentsInput = z.infer<typeof updateAntecedentsSchema>
export type CreateVaccinationInput = z.infer<typeof createVaccinationSchema>
