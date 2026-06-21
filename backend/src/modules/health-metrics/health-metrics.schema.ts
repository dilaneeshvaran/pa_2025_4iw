import { z } from 'zod';

export const recordMetricSchema = z.object({
  metricType: z.enum(['WEIGHT', 'TEMPERATURE', 'BLOOD_PRESSURE', 'HEART_RATE', 'BLOOD_GLUCOSE']),
  value: z.number().positive('La valeur doit être strictement supérieure à 0'),
  unit: z.string().min(1, "L'unité est obligatoire"),
  recordedAt: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
});
