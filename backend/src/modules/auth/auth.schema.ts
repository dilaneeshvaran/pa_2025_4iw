import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(
      /[^A-Za-z0-9]/,
      'Le mot de passe doit contenir au moins un caractère spécial',
    ),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]+$/, 'Le numéro de téléphone contient des caractères non autorisés')
    .refine((val) => {
      const digits = val.replace(/\D/g, '')
      return digits.length >= 10 && digits.length <= 15
    }, 'Le numéro de téléphone doit contenir entre 10 et 15 chiffres'),
  dateOfBirth: z
    .string()
    .refine((val) => {
      const date = new Date(val)
      return !isNaN(date.getTime()) && date < new Date()
    }, 'La date de naissance doit être dans le passé'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
})

export type SignupInput = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalide'),
})

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Le token est requis'),
  newPassword: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(
      /[^A-Za-z0-9]/,
      'Le mot de passe doit contenir au moins un caractère spécial',
    ),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Le token est requis'),
})

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Le refresh token est requis'),
})

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalide'),
})

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>
