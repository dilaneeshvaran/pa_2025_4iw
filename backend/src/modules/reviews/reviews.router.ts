import { initServer } from '@ts-rest/fastify'
import { reviewsContract } from '@medicote/shared'
import { reviewsService } from './reviews.service'
import { authenticate } from '../../middleware/authenticate'
import prisma from '../../config/database'
import { sanitizeErrorMessage } from '../../utils/errors'
import { FastifyInstance, FastifyRequest } from 'fastify'

const s = initServer()

// @ts-rest/core 3.x types target zod 3, but this project uses zod 4 (whose
// schema types, e.g. ZodObject<…, $strip>, don't line up with ts-rest's
// inference). The handlers below are correctly shaped at runtime — explicit
// params and `status` codes matching the contract — so we assert the
// implementation to bypass the upstream zod 4 / ts-rest type mismatch.
const reviewsImpl = {
  createReview: async ({
    body,
    request,
  }: {
    body: { appointmentId: string; rating: number; comment?: string }
    request: FastifyRequest
  }) => {
    try {
      const user = request.user as { id: string; role: string }

      if (!user || user.role !== 'PATIENT') {
        return {
          status: 403 as const,
          body: { success: false, message: 'Accès refusé' },
        }
      }

      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!patient) {
        return {
          status: 404 as const,
          body: { success: false, message: 'Patient introuvable' },
        }
      }

      const review = await reviewsService.createReview(patient.id, body)

      return {
        status: 201 as const,
        body: {
          success: true,
          data: {
            id: review.id,
            appointmentId: review.appointmentId,
            patientId: review.patientId,
            practitionerId: review.practitionerId,
            rating: review.rating,
            comment: review.comment ?? null,
            createdAt: review.createdAt,
            isPublished: review.isPublished,
            response: review.response ?? null,
            respondedAt: review.respondedAt ?? null,
          },
          message: 'Avis publié avec succès',
        },
      }
    } catch (error: any) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors de la publication de l\'avis')
      return {
        status: 400 as const,
        body: { success: false, message },
      }
    }
  },

  getReviewByAppointment: async ({
    params: { appointmentId },
    request,
  }: {
    params: { appointmentId: string }
    request: FastifyRequest
  }) => {
    try {
      const user = request.user as { id: string; role: string }

      if (!user) {
        return {
          status: 404 as const,
          body: { success: false, message: 'Patient introuvable' },
        }
      }

      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!patient) {
        return {
          status: 404 as const,
          body: { success: false, message: 'Patient introuvable' },
        }
      }

      const review = await reviewsService.getReviewByAppointment(appointmentId, patient.id)

      return {
        status: 200 as const,
        body: {
          success: true,
          data: review ? {
            id: review.id,
            rating: review.rating,
            comment: review.comment ?? null,
            createdAt: review.createdAt,
            response: review.response ?? null,
            respondedAt: review.respondedAt ?? null,
          } : null,
        },
      }
    } catch (error: any) {
      request.log.error(error)
      return {
        status: 500 as const,
        body: { success: false, message: 'Erreur serveur' },
      }
    }
  },

  getPractitionerReviews: async ({
    params: { practitionerId },
  }: {
    params: { practitionerId: string }
    request: FastifyRequest
  }) => {
    try {
      const reviews = await reviewsService.getPractitionerReviews(practitionerId)

      return {
        status: 200 as const,
        body: {
          success: true,
          data: reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment ?? null,
            createdAt: r.createdAt,
            response: r.response ?? null,
            respondedAt: r.respondedAt ?? null,
            patient: r.patient ? {
              firstName: r.patient.firstName ?? null,
              lastName: r.patient.lastName ?? null,
            } : null,
          })),
        },
      }
    } catch (error: any) {
      return {
        status: 500 as const,
        body: { success: false, message: 'Erreur serveur' },
      }
    }
  },
}

export const reviewsRouter = s.router(reviewsContract, reviewsImpl as any)

// Fastify plugin to scope authentication hooks specifically to protected ts-rest routes
export async function reviewsTsRestRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    // Only run auth for POST /reviews and GET /reviews/appointment/:appointmentId
    const isPostReview = request.method === 'POST' && request.url.includes('/reviews')
    const isGetReviewByApt = request.method === 'GET' && request.url.includes('/reviews/appointment/')

    if (isPostReview || isGetReviewByApt) {
      await authenticate(request, reply)
    }
  })

  fastify.register(s.plugin(reviewsRouter))
}
