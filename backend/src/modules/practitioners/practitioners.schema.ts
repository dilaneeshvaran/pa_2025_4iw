import { z } from 'zod'

export const searchPractitionersSchema = z.object({
  search: z.string().optional(),
  specialtyId: z.string().optional(),
  cabinetId: z.string().optional(),
  city: z.string().optional(),
  teleconsultationEnabled: z.coerce.boolean().optional(),
  availableToday: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  acceptsInsurance: z.coerce.boolean().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(1).max(100).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

export const getPractitionerByIdSchema = z.object({
  id: z.string(),
})

export const getCabinetByIdSchema = z.object({
  id: z.string(),
})

export const getAvailableSlotsSchema = z.object({
  id: z.string(),
  startDate: z.string().optional(), // iso date string
  endDate: z.string().optional(), // iso date string
  days: z.coerce.number().min(1).max(90).default(7), // number of days to look ahead
})

export const getPractitionerStatisticsSchema = z.object({
  period: z
    .enum(['semaine', 'mois', 'annee', 'personnalise'])
    .optional()
    .default('mois'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type SearchPractitionersInput = z.infer<typeof searchPractitionersSchema>
export type GetPractitionerByIdInput = z.infer<typeof getPractitionerByIdSchema>
export type GetCabinetByIdInput = z.infer<typeof getCabinetByIdSchema>
export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsSchema>
export type GetPractitionerStatisticsInput = z.infer<
  typeof getPractitionerStatisticsSchema
>
