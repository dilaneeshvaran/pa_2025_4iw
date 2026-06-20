import { z } from 'zod'

export const updateCabinetInfoSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]+$/, 'Le numéro de téléphone contient des caractères non autorisés')
    .refine((val) => {
      const digits = val.replace(/\D/g, '')
      return digits.length >= 10 && digits.length <= 15
    }, 'Le numéro de téléphone doit contenir entre 10 et 15 chiffres')
    .optional(),
  openHours: z
    .record(
      z.string(),
      z.object({
        open: z.string().optional(),
        close: z.string().optional(),
        closed: z.boolean().optional(),
      }),
    )
    .optional(),
})

export type UpdateCabinetInfoInput = z.infer<typeof updateCabinetInfoSchema>

export const invitePractitionerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

export type InvitePractitionerInput = z.infer<typeof invitePractitionerSchema>

export const createStaffSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]+$/, 'Le numéro de téléphone contient des caractères non autorisés')
    .refine((val) => {
      const digits = val.replace(/\D/g, '')
      return digits.length >= 10 && digits.length <= 15
    }, 'Le numéro de téléphone doit contenir entre 10 et 15 chiffres'),
  position: z.string().min(1),
})

export type CreateStaffInput = z.infer<typeof createStaffSchema>

export const updateStaffSchema = z.object({
  position: z.string().min(1),
})

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>
