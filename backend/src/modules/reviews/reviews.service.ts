import prisma from '../../config/database'
import { CreateReviewInput } from './reviews.schema'

export class ReviewsService {
  async createReview(patientId: string, data: CreateReviewInput) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: data.appointmentId, patientId },
    })

    if (!appointment) {
      throw new Error('Rendez-vous introuvable')
    }
    if (appointment.status !== 'COMPLETED') {
      throw new Error('Le rendez-vous doit être terminé pour laisser un avis')
    }

    const existing = await prisma.review.findUnique({
      where: { appointmentId: data.appointmentId },
    })
    if (existing) {
      throw new Error('Vous avez déjà laissé un avis pour ce rendez-vous')
    }

    const review = await prisma.review.create({
      data: {
        appointmentId: data.appointmentId,
        patientId,
        practitionerId: appointment.practitionerId,
        rating: data.rating,
        comment: data.comment,
      },
    })

    const stats = await prisma.review.aggregate({
      where: { practitionerId: appointment.practitionerId },
      _avg: { rating: true },
      _count: true,
    })

    await prisma.practitioner.update({
      where: { id: appointment.practitionerId },
      data: {
        averageRating: stats._avg.rating ?? undefined,
        totalReviews: stats._count,
      },
    })

    return review
  }

  async getReviewByAppointment(appointmentId: string, patientId: string) {
    return prisma.review.findFirst({
      where: { appointmentId, patientId },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        response: true,
        respondedAt: true,
      },
    })
  }

  async getPractitionerReviews(practitionerId: string) {
    return prisma.review.findMany({
      where: { practitionerId, isPublished: true },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        response: true,
        respondedAt: true,
        patient: {
          select: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const reviewsService = new ReviewsService()
