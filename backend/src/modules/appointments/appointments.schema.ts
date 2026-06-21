import { z } from 'zod'

export const createAppointmentSchema = z.object({
  practitionerId: z.string().min(1, 'Practitioner ID is required'),
  cabinetId: z.string().optional(),
  appointmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
  type: z.enum(['IN_PERSON', 'TELECONSULTATION']),
  reason: z.string().optional(),
})

export const reserveSlotSchema = z.object({
  practitionerId: z.string().min(1, 'Practitioner ID is required'),
  appointmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
})

export const toggleEarlierSlotAlertSchema = z.object({
  enabled: z.boolean({ error: 'Le champ "enabled" doit être un booléen' }),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type ReserveSlotInput = z.infer<typeof reserveSlotSchema>
export type ToggleEarlierSlotAlertInput = z.infer<
  typeof toggleEarlierSlotAlertSchema
>
