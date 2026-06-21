import { initContract } from '@ts-rest/core'
import { z } from 'zod'

const c = initContract()

export const createReviewSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export const reviewSchema = z.object({
  id: z.string(),
  appointmentId: z.string(),
  patientId: z.string(),
  practitionerId: z.string(),
  rating: z.number().int(),
  comment: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()),
  isPublished: z.boolean(),
  response: z.string().nullable().optional(),
  respondedAt: z.date().or(z.string()).nullable().optional(),
})

export const reviewsContract = c.router({
  createReview: {
    method: 'POST',
    path: '/reviews',
    body: createReviewSchema,
    responses: {
      201: z.object({
        success: z.boolean(),
        data: reviewSchema,
        message: z.string(),
      }),
      400: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      403: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      404: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
    },
    summary: 'Publish a new review',
  },
  getReviewByAppointment: {
    method: 'GET',
    path: '/reviews/appointment/:appointmentId',
    pathParams: z.object({
      appointmentId: z.string(),
    }),
    responses: {
      200: z.object({
        success: z.boolean(),
        data: z.object({
          id: z.string(),
          rating: z.number().int(),
          comment: z.string().nullable().optional(),
          createdAt: z.date().or(z.string()),
          response: z.string().nullable().optional(),
          respondedAt: z.date().or(z.string()).nullable().optional(),
        }).nullable(),
      }),
      404: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      500: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
    },
    summary: 'Get review for a specific appointment',
  },
  getPractitionerReviews: {
    method: 'GET',
    path: '/reviews/practitioner/:practitionerId',
    pathParams: z.object({
      practitionerId: z.string(),
    }),
    responses: {
      200: z.object({
        success: z.boolean(),
        data: z.array(z.object({
          id: z.string(),
          rating: z.number().int(),
          comment: z.string().nullable().optional(),
          createdAt: z.date().or(z.string()),
          response: z.string().nullable().optional(),
          respondedAt: z.date().or(z.string()).nullable().optional(),
          patient: z.object({
            firstName: z.string().nullable().optional(),
            lastName: z.string().nullable().optional(),
          }).nullable().optional(),
        })),
      }),
      500: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
    },
    summary: 'Get public reviews for a practitioner',
  },
})
