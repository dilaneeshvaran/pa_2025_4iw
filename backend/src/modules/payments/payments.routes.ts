import { FastifyInstance } from 'fastify'
import { paymentsController } from './payments.controller'
import { authenticate } from '../../middleware/authenticate'
import {
  createPaymentSchema,
  createCabinetPaymentSchema,
  addPaymentMethodSchema,
  verifyPaymentMethodSchema,
} from './payments.schema'
import { authorize } from '../../middleware/authorize'

export async function paymentsRoutes(fastify: FastifyInstance) {
  // get patient payments history
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    paymentsController.getPatientPayments.bind(paymentsController),
  )

  // create payment for appointment (pre pay)
  fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      createPaymentSchema.parse(request.body)
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.errors?.[0]?.message || 'Données de paiement invalides',
      })
    }
    return paymentsController.createPayment(request, reply)
  })

  // refund a payment
  fastify.post(
    '/:paymentId/refund',
    { preHandler: [authenticate] },
    paymentsController.processRefund.bind(paymentsController),
  )

  // get invoice detail
  fastify.get(
    '/invoices/:invoiceId',
    { preHandler: [authenticate] },
    paymentsController.getInvoiceDetail.bind(paymentsController),
  )

  // download invoice as pdf/html
  fastify.get(
    '/invoices/:invoiceId/download',
    { preHandler: [authenticate] },
    paymentsController.downloadInvoicePdf.bind(paymentsController),
  )

  fastify.get(
    '/practitioner/invoices',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    paymentsController.getPractitionerInvoices.bind(paymentsController),
  )

  fastify.get(
    '/practitioner/unpaid-appointments',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    paymentsController.getPractitionerUnpaidAppointments.bind(
      paymentsController,
    ),
  )

  fastify.post(
    '/practitioner/cabinet-payment',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    async (request, reply) => {
      try {
        createCabinetPaymentSchema.parse(request.body)
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          message: error.errors?.[0]?.message || 'Données invalides',
        })
      }
      return paymentsController.createCabinetPayment(request, reply)
    },
  )

  fastify.get(
    '/practitioner/invoices/:invoiceId',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    paymentsController.getPractitionerInvoiceDetail.bind(paymentsController),
  )

  fastify.get(
    '/practitioner/invoices/:invoiceId/download',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    paymentsController.downloadPractitionerInvoicePdf.bind(paymentsController),
  )

  // get all saved payment methods
  fastify.get(
    '/methods',
    { preHandler: [authenticate] },
    paymentsController.getSavedPaymentMethods.bind(paymentsController),
  )

  // add a new payment method
  fastify.post(
    '/methods',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        addPaymentMethodSchema.parse(request.body)
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          message: error.errors?.[0]?.message || 'Données invalides',
        })
      }
      return paymentsController.addPaymentMethod(request, reply)
    },
  )

  // verify a payment method (otp/card verif)
  fastify.post(
    '/methods/:methodId/verify',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        verifyPaymentMethodSchema.parse(request.body)
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          message:
            error.errors?.[0]?.message || 'Code de vérification invalide',
        })
      }
      return paymentsController.verifyPaymentMethod(request, reply)
    },
  )

  fastify.delete(
    '/methods/:methodId',
    { preHandler: [authenticate] },
    paymentsController.deletePaymentMethod.bind(paymentsController),
  )

  // set default payment method
  fastify.patch(
    '/methods/:methodId/default',
    { preHandler: [authenticate] },
    paymentsController.setDefaultPaymentMethod.bind(paymentsController),
  )
}
