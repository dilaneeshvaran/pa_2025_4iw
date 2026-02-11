import { z } from 'zod'

export const getDocumentsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('12'),
  type: z
    .enum(['all', 'prescriptions', 'exams', 'certificates', 'others'])
    .optional()
    .default('all'),
  search: z.string().optional(),
})

export const uploadDocumentSchema = z.object({
  type: z.enum([
    'PRESCRIPTION',
    'LAB_RESULT',
    'RADIOLOGY',
    'MEDICAL_REPORT',
    'CERTIFICATE',
    'CONSENT_FORM',
    'INSURANCE',
    'OTHER',
  ]),
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
})

export type GetDocumentsQuery = z.infer<typeof getDocumentsQuerySchema>
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>
