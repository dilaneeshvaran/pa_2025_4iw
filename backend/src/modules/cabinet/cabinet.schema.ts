import { z } from 'zod'

export const updateCabinetInfoSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
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
  phone: z.string().min(1),
  position: z.string().min(1),
})

export type CreateStaffInput = z.infer<typeof createStaffSchema>

export const updateStaffSchema = z.object({
  position: z.string().min(1),
})

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>
