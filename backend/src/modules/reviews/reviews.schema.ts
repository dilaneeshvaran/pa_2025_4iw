import { z } from 'zod'

export const createReviewSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
