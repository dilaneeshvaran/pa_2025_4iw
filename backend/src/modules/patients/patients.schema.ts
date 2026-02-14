import { z } from 'zod'

export const patientsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z
    .enum(['name', 'lastVisit', 'nextAppointment', 'totalConsultations'])
    .default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  filter: z
    .enum(['all', 'new', 'withUpcoming', 'withoutUpcoming'])
    .default('all'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
})

export type PatientsListQuery = z.infer<typeof patientsListQuerySchema>
