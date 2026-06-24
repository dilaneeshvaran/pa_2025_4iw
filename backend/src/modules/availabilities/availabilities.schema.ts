import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const upsertAvailabilitySchema = z.object({
  cabinetId: z.string().cuid().nullable().optional(),
  dayOfWeek: z.enum([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ]),
  startTime: z.string().regex(timeRegex, 'Format HH:mm requis'),
  endTime: z.string().regex(timeRegex, 'Format HH:mm requis'),
  slotDuration: z.number().int().min(5).max(120).optional(),
  breakStartTime: z
    .string()
    .regex(timeRegex, 'Format HH:mm requis')
    .nullable()
    .optional(),
  breakEndTime: z
    .string()
    .regex(timeRegex, 'Format HH:mm requis')
    .nullable()
    .optional(),
  isEmergencySlot: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export const createAbsenceSchema = z.object({
  cabinetId: z.string().cuid().nullable().optional(),
  startDate: z.string().min(1, 'Date de début requise'),
  endDate: z.string().min(1, 'Date de fin requise'),
  reason: z.string().max(500).optional(),
})

export const createBlockedSlotSchema = z.object({
  cabinetId: z.string().cuid().nullable().optional(),
  date: z.string().min(1, 'Date requise'),
  startTime: z.string().regex(timeRegex, 'Format HH:mm requis'),
  endTime: z.string().regex(timeRegex, 'Format HH:mm requis'),
  reason: z.string().max(500).optional(),
})

export const updateSettingsSchema = z.object({
  consultationDuration: z.number().int().min(5).max(120).optional(),
  teleconsultationEnabled: z.boolean().optional(),
  homeVisitEnabled: z.boolean().optional(),
  emergencySlotsEnabled: z.boolean().optional(),
  backToBack: z.boolean().optional(),
  breakBetweenSlots: z.number().int().min(0).max(60).optional(),
  minBookingNotice: z.number().int().min(0).optional(),
  maxBookingAdvance: z.number().int().min(1).max(365).optional(),
  cancellationNotice: z.number().int().min(0).optional(),
  acceptsNewPatients: z.boolean().optional(),
  newPatientMaxPerDay: z.number().int().min(0).optional(),
  baseConsultationFee: z.number().min(0).optional(),
  teleconsultationFee: z.number().min(0).nullable().optional(),
  noShowThreshold: z.number().int().min(1).max(50).optional(),
  noShowPenaltyDays: z.number().int().min(1).max(365).optional(),
  noShowAutoBlock: z.boolean().optional(),
})

export const createPractitionerAppointmentSchema = z.object({
  cabinetId: z.string().cuid().nullable().optional(),
  patientId: z.string().min(1, 'Patient requis'),
  appointmentDate: z.string().min(1, 'Date requise'),
  startTime: z.string().regex(timeRegex, 'Format HH:mm requis'),
  type: z.enum(['IN_PERSON', 'TELECONSULTATION']),
  reason: z.string().max(500).optional(),
})

export type UpsertAvailabilityInput = z.infer<typeof upsertAvailabilitySchema>
export type CreateAbsenceInput = z.infer<typeof createAbsenceSchema>
export type CreateBlockedSlotInput = z.infer<typeof createBlockedSlotSchema>
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
export type CreatePractitionerAppointmentInput = z.infer<
  typeof createPractitionerAppointmentSchema
>

export const practitionerCancelAppointmentSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const practitionerModifyAppointmentSchema = z.object({
  appointmentDate: z.string().min(1, 'Date requise'),
  startTime: z.string().regex(timeRegex, 'Format HH:mm requis'),
})

export type PractitionerCancelAppointmentInput = z.infer<
  typeof practitionerCancelAppointmentSchema
>
export type PractitionerModifyAppointmentInput = z.infer<
  typeof practitionerModifyAppointmentSchema
>
