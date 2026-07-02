import { FastifyRequest, FastifyReply } from 'fastify'
import { paymentsService } from './payments.service'
import prisma from '../../config/database'
import { sanitizeErrorMessage } from '../../utils/errors'

export class PaymentsController {
  private async resolvePractitionerId(request: FastifyRequest, reply: FastifyReply, fallbackPractitionerId?: string): Promise<string | null> {
    const user = request.user as { id: string; role: string }

    if (user.role === 'STAFF') {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
        include: { cabinet: { include: { practitioners: true } } }
      })

      if (!staff || !staff.canManagePayments) {
        reply.status(403).send({ success: false, message: 'Accès non autorisé' })
        return null
      }

      if (staff.practitionerId) {
        return staff.practitionerId
      } else if (staff.cabinetId) {
        if (!fallbackPractitionerId) {
          reply.status(400).send({ success: false, message: 'ID du praticien requis' })
          return null
        }
        const isAssociated = staff.cabinet?.practitioners.some(p => p.practitionerId === fallbackPractitionerId && !p.isPaused)
        if (!isAssociated) {
          reply.status(403).send({ success: false, message: 'Praticien non associé au cabinet' })
          return null
        }
        return fallbackPractitionerId
      }
    } else {
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner) {
        reply.status(404).send({ success: false, message: 'Profil praticien non trouvé' })
        return null
      }
      return practitioner.id
    }
    return null
  }

  async getPatientPayments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const query = request.query as {
        page?: string
        limit?: string
        status?: string
      }

      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!patient) {
        return reply.status(404).send({
          success: false,
          message: 'Profil patient non trouvé',
        })
      }

      const result = await paymentsService.getPatientPayments(
        patient.id,
        parseInt(query.page || '1'),
        parseInt(query.limit || '10'),
        query.status,
      )

      return reply.send({ success: true, ...result })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors de la récupération des paiements',
      })
    }
  }

  async createPayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const body = request.body as any

      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!patient) {
        return reply.status(404).send({
          success: false,
          message: 'Profil patient non trouvé',
        })
      }

      const payment = await paymentsService.createPaymentForAppointment({
        appointmentId: body.appointmentId,
        patientId: patient.id,
        practitionerId: '', // will be resolved from appointment
        amount: 0, // will be taken from appointment fee
        method: body.method,
        savedPaymentMethodId: body.savedPaymentMethodId,
        mobileOperator: body.mobileOperator,
        mobileNumber: body.mobileNumber,
        cardLast4: body.cardLast4,
        cardBrand: body.cardBrand,
      })

      return reply.status(201).send({
        success: true,
        data: payment,
        message: 'Paiement effectué avec succès',
      })
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors du paiement')
      return reply.status(400).send({ success: false, message })
    }
  }

  async processRefund(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const { paymentId } = request.params as { paymentId: string }
      const body = request.body as { reason?: string }

      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!patient) {
        return reply.status(404).send({
          success: false,
          message: 'Profil patient non trouvé',
        })
      }

      const result = await paymentsService.processRefund(
        paymentId,
        patient.id,
        body.reason,
      )

      return reply.send({
        success: true,
        data: result,
      })
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors du remboursement')
      return reply.status(400).send({ success: false, message })
    }
  }

  async getInvoiceDetail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const { invoiceId } = request.params as { invoiceId: string }

      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!patient) {
        return reply.status(404).send({
          success: false,
          message: 'Profil patient non trouvé',
        })
      }

      const invoice = await paymentsService.getInvoiceDetail(
        invoiceId,
        patient.id,
      )

      return reply.send({ success: true, data: invoice })
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors de la récupération de la facture')
      return reply.status(400).send({ success: false, message })
    }
  }

  async downloadInvoicePdf(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const { invoiceId } = request.params as { invoiceId: string }

      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!patient) {
        return reply.status(404).send({
          success: false,
          message: 'Profil patient non trouvé',
        })
      }

      const pdfBuffer = await paymentsService.generateInvoicePdf(
        invoiceId,
        patient.id,
      )

      // get invoice number for filename
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: { invoiceNumber: true },
      })

      return reply
        .header('Content-Type', 'application/pdf')
        .header(
          'Content-Disposition',
          `attachment; filename="facture-${invoice?.invoiceNumber || invoiceId}.pdf"`,
        )
        .send(pdfBuffer)
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors du téléchargement')
      return reply.status(400).send({ success: false, message })
    }
  }

  private async getProfileIdAndRole(user: { id: string; role: string }) {
    if (user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!patient) throw new Error('Profil patient non trouvé')
      return { profileId: patient.id, role: 'PATIENT' }
    } else if (user.role === 'PRACTITIONER') {
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!practitioner) throw new Error('Profil praticien non trouvé')
      return { profileId: practitioner.id, role: 'PRACTITIONER' }
    } else {
      throw new Error('Rôle non autorisé pour gérer les moyens de paiement')
    }
  }

  async getSavedPaymentMethods(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const { profileId, role } = await this.getProfileIdAndRole(user)

      const methods = await paymentsService.getSavedPaymentMethods(profileId, role)

      return reply.send({ success: true, data: methods })
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors de la récupération des moyens de paiement')
      return reply.status(400).send({
        success: false,
        message,
      })
    }
  }

  async addPaymentMethod(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const body = request.body as any
      const { profileId, role } = await this.getProfileIdAndRole(user)

      const method = await paymentsService.addPaymentMethod(profileId, body, role)

      return reply.status(201).send({
        success: true,
        data: method,
        message: 'Moyen de paiement ajouté. Veuillez le vérifier.',
      })
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, "Erreur lors de l'ajout du moyen de paiement")
      return reply.status(400).send({ success: false, message })
    }
  }

  async verifyPaymentMethod(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const { methodId } = request.params as { methodId: string }
      const body = request.body as { verificationCode: string }
      const { profileId, role } = await this.getProfileIdAndRole(user)

      const method = await paymentsService.verifyPaymentMethod(
        methodId,
        profileId,
        body.verificationCode,
        role,
      )

      return reply.send({
        success: true,
        data: method,
        message: 'Moyen de paiement vérifié avec succès',
      })
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors de la vérification')
      return reply.status(400).send({ success: false, message })
    }
  }

  async deletePaymentMethod(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const { methodId } = request.params as { methodId: string }
      const { profileId, role } = await this.getProfileIdAndRole(user)

      await paymentsService.deletePaymentMethod(methodId, profileId, role)

      return reply.send({
        success: true,
        message: 'Moyen de paiement supprimé',
      })
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors de la suppression')
      return reply.status(400).send({ success: false, message })
    }
  }

  async setDefaultPaymentMethod(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const { methodId } = request.params as { methodId: string }
      const { profileId, role } = await this.getProfileIdAndRole(user)

      await paymentsService.setDefaultPaymentMethod(methodId, profileId, role)

      return reply.send({
        success: true,
        message: 'Moyen de paiement par défaut mis à jour',
      })
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors de la mise à jour')
      return reply.status(400).send({ success: false, message })
    }
  }

  async getPractitionerInvoices(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const query = request.query as {
        page?: string
        limit?: string
        search?: string // allow search by patient name
        status?: string
        practitionerId?: string
      }

      const practitionerId = await this.resolvePractitionerId(request, reply, query.practitionerId)
      if (!practitionerId) return

      const result = await paymentsService.getPractitionerInvoices(
        practitionerId,
        parseInt(query.page || '1'),
        parseInt(query.limit || '10'),
        query.search,
        query.status,
      )

      return reply.send({ success: true, ...result })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: 'Erreur lors de la récupération des factures',
      })
    }
  }

  async createCabinetPayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: string; role: string }
      const body = request.body as any

      const practitionerId = await this.resolvePractitionerId(request, reply, body.practitionerId)
      if (!practitionerId) return

      const payment = await paymentsService.createCabinetPayment(
        practitionerId,
        body.appointmentId,
        body.amount,
        body.method,
        body.notes,
      )

      return reply.status(201).send({
        success: true,
        data: payment,
        message: 'Facture créée avec succès',
      })
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors de la facturation')
      return reply.status(400).send({ success: false, message })
    }
  }

  async getPractitionerUnpaidAppointments(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const user = request.user as { id: string; role: string }

      const query = request.query as { practitionerId?: string }

      const practitionerId = await this.resolvePractitionerId(request, reply, query.practitionerId)
      if (!practitionerId) return

      const appointments =
        await paymentsService.getPractitionerUnpaidAppointments(practitionerId)

      return reply.send({ success: true, data: appointments })
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors de la récupération des rendez-vous non payés')
      return reply.status(400).send({ success: false, message })
    }
  }

  async getPractitionerInvoiceDetail(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const user = request.user as { id: string; role: string }
      const { invoiceId } = request.params as { invoiceId: string }
      const query = request.query as { practitionerId?: string }

      const practitionerId = await this.resolvePractitionerId(request, reply, query.practitionerId)
      if (!practitionerId) return

      const invoice = await paymentsService.getPractitionerInvoiceDetail(
        invoiceId,
        practitionerId,
      )

      return reply.send({ success: true, data: invoice })
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors de la récupération de la facture')
      return reply.status(400).send({ success: false, message })
    }
  }

  async downloadPractitionerInvoicePdf(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const user = request.user as { id: string; role: string }
      const { invoiceId } = request.params as { invoiceId: string }
      const query = request.query as { practitionerId?: string }

      const practitionerId = await this.resolvePractitionerId(request, reply, query.practitionerId)
      if (!practitionerId) return

      const pdfBuffer = await paymentsService.generatePractitionerInvoicePdf(
        invoiceId,
        practitionerId,
      )

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: { invoiceNumber: true },
      })

      return reply
        .header('Content-Type', 'application/pdf')
        .header(
          'Content-Disposition',
          `attachment; filename="facture-${invoice?.invoiceNumber || invoiceId}.pdf"`,
        )
        .send(pdfBuffer)
    } catch (error) {
      request.log.error(error)
      const message = sanitizeErrorMessage(error, 'Erreur lors du téléchargement')
      return reply.status(400).send({ success: false, message })
    }
  }
}

export const paymentsController = new PaymentsController()
