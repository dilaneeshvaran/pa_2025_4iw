import { z } from 'zod'

export const getPatientAppointmentsSchema = z.object({
  status: z.enum(['upcoming', 'past', 'all']).optional().default('all'),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
  page: z.coerce.number().min(1).optional().default(1),
})

export type GetPatientAppointmentsInput = z.infer<
  typeof getPatientAppointmentsSchema
>
