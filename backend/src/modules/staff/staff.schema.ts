import { z } from 'zod'

export const moveAppointmentSchema = z.object({
  newDate: z.string(),
  newStartTime: z.string(),
  newEndTime: z.string(),
})

export type MoveAppointmentInput = z.infer<typeof moveAppointmentSchema>

export const bookAppointmentSchema = z.object({
  patientId: z.string(),
  appointmentDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  type: z.enum(['IN_PERSON', 'TELECONSULTATION']),
  reason: z.string().optional(),
})

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>
