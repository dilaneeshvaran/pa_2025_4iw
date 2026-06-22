import { z } from 'zod'

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "L'horaire doit être au format HH:mm")

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La date doit être au format YYYY-MM-DD')

export const dayOfWeekSchema = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
])

const intervalRecurrenceSchema = z.object({
  type: z.literal('INTERVAL'),
  intervalValue: z.coerce.number().int().min(1).max(30),
  intervalUnit: z.enum(['DAY', 'WEEK']),
})

const weekdaysRecurrenceSchema = z.object({
  type: z.literal('WEEKDAYS'),
  daysOfWeek: z
    .array(dayOfWeekSchema)
    .min(1)
    .max(7)
    .refine((days) => new Set(days).size === days.length, {
      message: "Un jour ne peut être sélectionné qu'une seule fois",
    }),
})

export const createHealthReminderSchema = z.object({
  message: z.string().trim().min(3).max(500),
  times: z
    .array(timeSchema)
    .min(1)
    .max(6)
    .refine((times) => new Set(times).size === times.length, {
      message: "Un horaire ne peut être ajouté qu'une seule fois",
    }),
  startDate: dateOnlySchema,
  durationValue: z.coerce.number().int().min(1).max(365),
  durationUnit: z.enum(['DAY', 'WEEK', 'MONTH']),
  recurrence: z.discriminatedUnion('type', [
    intervalRecurrenceSchema,
    weekdaysRecurrenceSchema,
  ]),
})

export const healthReminderPatientParamsSchema = z.object({
  patientId: z.string().min(1),
})

export const healthReminderParamsSchema = z.object({
  reminderId: z.string().min(1),
})

export const patientDashboardRemindersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
})

export type CreateHealthReminderInput = z.infer<
  typeof createHealthReminderSchema
>
export type HealthReminderPatientParams = z.infer<
  typeof healthReminderPatientParamsSchema
>
export type HealthReminderParams = z.infer<typeof healthReminderParamsSchema>
export type PatientDashboardRemindersQuery = z.infer<
  typeof patientDashboardRemindersQuerySchema
>
