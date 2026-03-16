import { z } from 'zod'

export const createPaymentSchema = z.object({
  appointmentId: z.string().min(1, "L'identifiant du rendez-vous est requis"),
  method: z.enum(['CARD', 'MOBILE_MONEY', 'CASH'], {
    message: 'Méthode de paiement invalide',
  }),
  savedPaymentMethodId: z.string().optional(),
  // mobile money
  mobileOperator: z.string().optional(),
  mobileNumber: z.string().optional(),
  // card
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.string().optional(),
})

export const createCabinetPaymentSchema = z.object({
  appointmentId: z.string().min(1, "L'identifiant du rendez-vous est requis"),
  practitionerId: z.string().optional(),
  method: z.enum(
    ['CASH', 'CARD', 'MOBILE_MONEY', 'CHECK', 'TRANSFER', 'OTHER'],
    {
      message: 'Méthode de paiement invalide',
    },
  ),
})

export const addPaymentMethodSchema = z
  .object({
    type: z.enum(['CARD', 'MOBILE_MONEY'], {
      message: 'Type de moyen de paiement invalide',
    }),
    label: z.string().optional(),
    isDefault: z.boolean().optional().default(false),
    // card
    cardLast4: z.string().length(4).optional(),
    cardBrand: z.string().optional(),
    cardExpMonth: z.number().min(1).max(12).optional(),
    cardExpYear: z.number().min(2025).optional(),
    // mobile money
    mobileOperator: z
      .enum(['orange_money', 'mtn_money', 'moov_money', 'wave'], {
        message: 'Opérateur mobile invalide',
      })
      .optional(),
    mobileNumber: z.string().min(8).max(15).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'CARD') {
        return (
          data.cardLast4 &&
          data.cardBrand &&
          data.cardExpMonth &&
          data.cardExpYear
        )
      }
      if (data.type === 'MOBILE_MONEY') {
        return data.mobileOperator && data.mobileNumber
      }
      return false
    },
    {
      message: 'Informations de paiement incomplètes pour le type sélectionné',
    },
  )

export const verifyPaymentMethodSchema = z.object({
  verificationCode: z.string().min(4).max(8, 'Code de vérification invalide'),
})
