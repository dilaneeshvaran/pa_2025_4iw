import prisma from '../../config/database'
import { PaymentMethod, PaymentStatus } from '@prisma/client'
import {
  PatientPayment,
  PatientPaymentsResult,
  SavedPaymentMethodResult,
  CreatePaymentData,
  AddPaymentMethodData,
  InvoiceDetail,
} from './payments.types'
import { sendInvoiceEmail } from '../../utils/email'
import puppeteer from 'puppeteer'

export class PaymentsService {
  // invoice history
  async getPatientPayments(
    patientId: string,
    page = 1,
    limit = 10,
    status?: string,
  ): Promise<PatientPaymentsResult> {
    const skip = (page - 1) * limit

    const where: any = { patientId }
    if (status && status !== 'all') {
      where.status = status.toUpperCase() as PaymentStatus
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: {
            include: {
              practitioner: {
                include: {
                  specialties: {
                    where: { isPrimary: true },
                    include: { specialty: true },
                    take: 1,
                  },
                },
              },
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              pdfPath: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ])

    return {
      data: payments.map((p) => ({
        id: p.id,
        appointmentId: p.appointmentId,
        amount: Number(p.amount),
        currency: p.currency,
        method: p.method,
        status: p.status,
        invoiceNumber: p.invoiceNumber,
        paidAt: p.paidAt?.toISOString() || null,
        refundedAmount: p.refundedAmount ? Number(p.refundedAmount) : null,
        refundedAt: p.refundedAt?.toISOString() || null,
        refundReason: p.refundReason,
        createdAt: p.createdAt.toISOString(),
        appointment: {
          id: p.appointment.id,
          appointmentDate: p.appointment.appointmentDate.toISOString(),
          startTime: p.appointment.startTime,
          endTime: p.appointment.endTime,
          type: p.appointment.type,
          status: p.appointment.status,
          practitioner: {
            id: p.appointment.practitioner.id,
            firstName: p.appointment.practitioner.firstName,
            lastName: p.appointment.practitioner.lastName,
            title: p.appointment.practitioner.title,
            specialty:
              p.appointment.practitioner.specialties[0]?.specialty.name || null,
          },
        },
        invoice: p.invoice
          ? {
              id: p.invoice.id,
              invoiceNumber: p.invoice.invoiceNumber,
              pdfPath: p.invoice.pdfPath,
            }
          : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getInvoiceDetail(
    invoiceId: string,
    patientId: string,
  ): Promise<InvoiceDetail> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payment: {
          include: {
            appointment: {
              include: {
                practitioner: {
                  select: {
                    firstName: true,
                    lastName: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      throw new Error('Facture non trouvée')
    }

    if (invoice.payment.patientId !== patientId) {
      throw new Error("Vous n'avez pas accès à cette facture")
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toISOString(),
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      currency: invoice.currency,
      items: invoice.items as any[],
      billedToName: invoice.billedToName,
      billedToAddress: invoice.billedToAddress,
      billedToEmail: invoice.billedToEmail,
      billedToPhone: invoice.billedToPhone,
      billedFromName: invoice.billedFromName,
      billedFromAddress: invoice.billedFromAddress,
      billedFromLicense: invoice.billedFromLicense,
      pdfPath: invoice.pdfPath,
      createdAt: invoice.createdAt.toISOString(),
      payment: {
        id: invoice.payment.id,
        method: invoice.payment.method,
        status: invoice.payment.status,
        paidAt: invoice.payment.paidAt?.toISOString() || null,
        appointment: {
          id: invoice.payment.appointment.id,
          appointmentDate:
            invoice.payment.appointment.appointmentDate.toISOString(),
          startTime: invoice.payment.appointment.startTime,
          type: invoice.payment.appointment.type,
          practitioner: {
            firstName: invoice.payment.appointment.practitioner.firstName,
            lastName: invoice.payment.appointment.practitioner.lastName,
            title: invoice.payment.appointment.practitioner.title,
          },
        },
      },
    }
  }

  // appointment pre paiment
  async createPaymentForAppointment(
    data: CreatePaymentData,
  ): Promise<PatientPayment> {
    // verify appointment exists and belongs to patient
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        payment: true,
        practitioner: {
          include: {
            specialties: {
              where: { isPrimary: true },
              include: { specialty: true },
              take: 1,
            },
          },
        },
        patient: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    })

    if (!appointment) {
      throw new Error('Rendez-vous non trouvé')
    }

    if (appointment.patientId !== data.patientId) {
      throw new Error("Vous n'avez pas accès à ce rendez-vous")
    }

    // if a pending payment exists, update it instead of creating a new one
    if (appointment.payment) {
      if (appointment.payment.status === 'COMPLETED') {
        throw new Error('Ce rendez-vous a déjà été payé')
      }
      if (appointment.payment.status === 'PENDING') {
        // update existing pending payment to comepleted
        return this.processExistingPendingPayment(
          appointment.payment.id,
          data,
          appointment,
        )
      }
      throw new Error('Ce rendez-vous a déjà un paiement en cours')
    }

    if (appointment.status === 'CANCELLED') {
      throw new Error('Impossible de payer un rendez-vous annulé')
    }

    // generate unique invoice number
    // MED-YYYYMMDD-XXXX
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.payment.count()
    const invoiceNumber = `MED-${dateStr}-${(count + 1).toString().padStart(4, '0')}`

    const amount = Number(appointment.consultationFee)

    // todo : call orange money / mtn / wve / stripe
    // for now  simulate the payment processing
    const payment = await prisma.payment.create({
      data: {
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        practitionerId: appointment.practitionerId,
        amount: amount,
        currency: 'XOF',
        method: data.method as PaymentMethod,
        status: 'COMPLETED',
        invoiceNumber,
        paidAt: now,
        mobileMoneyRef:
          data.method === 'MOBILE_MONEY'
            ? `MM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            : null,
        stripePaymentId:
          data.method === 'CARD'
            ? `pi_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
            : null,
      },
      include: {
        appointment: {
          include: {
            practitioner: {
              include: {
                specialties: {
                  where: { isPrimary: true },
                  include: { specialty: true },
                  take: 1,
                },
              },
            },
          },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, pdfPath: true },
        },
      },
    })

    // create the invoice record
    const invoice = await prisma.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNumber: invoiceNumber,
        invoiceDate: now,
        subtotal: amount,
        taxRate: 0,
        taxAmount: 0,
        total: amount,
        currency: 'XOF',
        items: [
          {
            description: `Consultation ${appointment.type === 'TELECONSULTATION' ? 'Téléconsultation' : 'En cabinet'} - ${appointment.practitioner.title} ${appointment.practitioner.lastName}`,
            quantity: 1,
            unitPrice: amount,
            amount: amount,
          },
        ],
        billedToName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        billedToAddress: appointment.patient.address || null,
        billedToEmail: appointment.patient.user.email,
        billedToPhone: appointment.patient.phone,
        billedFromName: `${appointment.practitioner.title} ${appointment.practitioner.firstName} ${appointment.practitioner.lastName}`,
        billedFromAddress: appointment.practitioner.address || null,
        billedFromLicense: appointment.practitioner.licenseNumber,
      },
    })

    // send email with pdf
    try {
      const pdfBuffer = await this.buildInvoicePdfContent({
        ...invoice,
        payment: {
          ...payment,
          appointment,
        },
      })

      await sendInvoiceEmail(
        appointment.patient.user.email,
        {
          patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          invoiceNumber: invoice.invoiceNumber,
          amount: amount,
          date: new Date(invoice.invoiceDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        },
        pdfBuffer,
      )
    } catch (err) {
      console.error('Failed to send invoice email after payment:', err)
      // dont fail
    }

    return {
      id: payment.id,
      appointmentId: payment.appointmentId,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      invoiceNumber: payment.invoiceNumber,
      paidAt: payment.paidAt?.toISOString() || null,
      refundedAmount: null,
      refundedAt: null,
      refundReason: null,
      createdAt: payment.createdAt.toISOString(),
      appointment: {
        id: appointment.id,
        appointmentDate: appointment.appointmentDate.toISOString(),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        type: appointment.type,
        status: appointment.status,
        practitioner: {
          id: appointment.practitioner.id,
          firstName: appointment.practitioner.firstName,
          lastName: appointment.practitioner.lastName,
          title: appointment.practitioner.title,
          specialty:
            appointment.practitioner.specialties[0]?.specialty.name || null,
        },
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        pdfPath: null,
      },
    }
  }

  // process an existing oending payment (complete it)
  private async processExistingPendingPayment(
    paymentId: string,
    data: CreatePaymentData,
    appointment: any,
  ): Promise<PatientPayment> {
    const now = new Date()

    // update payment status to completed
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        method: data.method as PaymentMethod,
        status: 'COMPLETED',
        paidAt: now,
        mobileMoneyRef:
          data.method === 'MOBILE_MONEY'
            ? `MM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            : null,
        stripePaymentId:
          data.method === 'CARD'
            ? `pi_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
            : null,
      },
      include: {
        appointment: {
          include: {
            practitioner: {
              include: {
                specialties: {
                  where: { isPrimary: true },
                  include: { specialty: true },
                  take: 1,
                },
              },
            },
          },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, pdfPath: true },
        },
      },
    })

    // create invoice if it doesnt exist
    let invoice = await prisma.invoice.findUnique({
      where: { paymentId: payment.id },
    })

    if (!invoice) {
      const amount = Number(payment.amount)
      invoice = await prisma.invoice.create({
        data: {
          paymentId: payment.id,
          invoiceNumber: payment.invoiceNumber,
          invoiceDate: now,
          subtotal: amount,
          taxRate: 0,
          taxAmount: 0,
          total: amount,
          currency: 'XOF',
          items: [
            {
              description: `Consultation ${appointment.type === 'TELECONSULTATION' ? 'Téléconsultation' : 'En cabinet'} - ${appointment.practitioner.title} ${appointment.practitioner.lastName}`,
              quantity: 1,
              unitPrice: amount,
              amount: amount,
            },
          ],
          billedToName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          billedToAddress: appointment.patient.address || null,
          billedToEmail: appointment.patient.user.email,
          billedToPhone: appointment.patient.phone,
          billedFromName: `${appointment.practitioner.title} ${appointment.practitioner.firstName} ${appointment.practitioner.lastName}`,
          billedFromAddress: appointment.practitioner.address || null,
          billedFromLicense: appointment.practitioner.licenseNumber,
        },
      })

      // send invoice email
      try {
        const pdfBuffer = await this.buildInvoicePdfContent({
          ...invoice,
          payment: {
            ...payment,
            appointment,
          },
        })

        await sendInvoiceEmail(
          appointment.patient.user.email,
          {
            patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            invoiceNumber: invoice.invoiceNumber,
            amount: Number(payment.amount),
            date: new Date(invoice.invoiceDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
          },
          pdfBuffer,
        )
      } catch (err) {
        console.error('Failed to send invoice email after payment:', err)
      }
    }

    return {
      id: payment.id,
      appointmentId: payment.appointmentId,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      invoiceNumber: payment.invoiceNumber,
      paidAt: payment.paidAt?.toISOString() || null,
      refundedAmount: null,
      refundedAt: null,
      refundReason: null,
      createdAt: payment.createdAt.toISOString(),
      appointment: {
        id: payment.appointment.id,
        appointmentDate: payment.appointment.appointmentDate.toISOString(),
        startTime: payment.appointment.startTime,
        endTime: payment.appointment.endTime,
        type: payment.appointment.type,
        status: payment.appointment.status,
        practitioner: {
          id: payment.appointment.practitioner.id,
          firstName: payment.appointment.practitioner.firstName,
          lastName: payment.appointment.practitioner.lastName,
          title: payment.appointment.practitioner.title,
          specialty:
            payment.appointment.practitioner.specialties[0]?.specialty.name ||
            null,
        },
      },
      invoice: invoice
        ? {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            pdfPath: invoice.pdfPath,
          }
        : null,
    }
  }

  //refund
  // rukes:
  //  - > 24h before appointment = full refund
  //  - 12-24h = 50% refund
  //  - < 12h = no refund
  // =========================================================================

  async processRefund(
    paymentId: string,
    patientId: string,
    reason?: string,
  ): Promise<{ refundedAmount: number; message: string }> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        appointment: true,
      },
    })

    if (!payment) {
      throw new Error('Paiement non trouvé')
    }

    if (payment.patientId !== patientId) {
      throw new Error("Vous n'avez pas accès à ce paiement")
    }

    if (payment.status !== 'COMPLETED') {
      throw new Error('Seuls les paiements complétés peuvent être remboursés')
    }

    if (payment.refundedAt) {
      throw new Error('Ce paiement a déjà été remboursé')
    }

    // calculate refund based on time until appointment
    const now = new Date()
    const aptDate = new Date(payment.appointment.appointmentDate)
    const [hours, minutes] = payment.appointment.startTime
      .split(':')
      .map(Number)
    aptDate.setHours(hours, minutes, 0, 0)

    const hoursUntilAppt =
      (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    const amount = Number(payment.amount)

    let refundAmount: number
    let message: string

    if (hoursUntilAppt > 24) {
      refundAmount = amount
      message =
        'Remboursement intégral effectué (annulation > 24h avant le rendez-vous)'
    } else if (hoursUntilAppt >= 12) {
      refundAmount = Math.round(amount * 0.5)
      message =
        'Remboursement de 50% effectué (annulation entre 12h et 24h avant le rendez-vous)'
    } else if (hoursUntilAppt > 0) {
      refundAmount = 0
      message =
        'Aucun remboursement possible (annulation < 12h avant le rendez-vous)'
    } else {
      throw new Error('Impossible de rembourser un rendez-vous passé')
    }

    if (refundAmount > 0) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: refundAmount === amount ? 'REFUNDED' : 'COMPLETED',
          refundedAmount: refundAmount,
          refundedAt: new Date(),
          refundReason: reason || 'Annulation par le patient',
        },
      })
    }

    return { refundedAmount: refundAmount, message }
  }

  async getSavedPaymentMethods(
    patientId: string,
  ): Promise<SavedPaymentMethodResult[]> {
    const methods = await prisma.savedPaymentMethod.findMany({
      where: { patientId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return methods.map((m) => ({
      id: m.id,
      type: m.type,
      label: m.label,
      isDefault: m.isDefault,
      cardLast4: m.cardLast4,
      cardBrand: m.cardBrand,
      cardExpMonth: m.cardExpMonth,
      cardExpYear: m.cardExpYear,
      mobileOperator: m.mobileOperator,
      mobileNumber: m.mobileNumber ? this.maskPhone(m.mobileNumber) : null,
      isVerified: m.isVerified,
      createdAt: m.createdAt.toISOString(),
    }))
  }

  async addPaymentMethod(
    patientId: string,
    data: AddPaymentMethodData,
  ): Promise<SavedPaymentMethodResult> {
    // if setting as default, unset other default
    if (data.isDefault) {
      await prisma.savedPaymentMethod.updateMany({
        where: { patientId, isDefault: true },
        data: { isDefault: false },
      })
    }

    //  gnerate label if not given by user
    let label = data.label
    if (!label) {
      if (data.type === 'MOBILE_MONEY') {
        const operatorLabels: Record<string, string> = {
          orange_money: 'Orange Money',
          mtn_money: 'MTN Mobile Money',
          moov_money: 'Moov Money',
          wave: 'Wave',
        }
        label = `${operatorLabels[data.mobileOperator || ''] || data.mobileOperator} - ${this.maskPhone(data.mobileNumber || '')}`
      } else {
        label = `${data.cardBrand || 'Carte'} •••• ${data.cardLast4}`
      }
    }

    // check duplicates
    if (data.type === 'MOBILE_MONEY') {
      const existing = await prisma.savedPaymentMethod.findFirst({
        where: {
          patientId,
          type: 'MOBILE_MONEY',
          mobileOperator: data.mobileOperator,
          mobileNumber: data.mobileNumber,
        },
      })
      if (existing) {
        throw new Error('Ce moyen de paiement mobile est déjà enregistré')
      }
    }

    const method = await prisma.savedPaymentMethod.create({
      data: {
        patientId,
        type: data.type as PaymentMethod,
        label: label!,
        isDefault: data.isDefault || false,
        cardLast4: data.cardLast4 || null,
        cardBrand: data.cardBrand || null,
        cardExpMonth: data.cardExpMonth || null,
        cardExpYear: data.cardExpYear || null,
        mobileOperator: data.mobileOperator || null,
        mobileNumber: data.mobileNumber || null,
        // todo : in prod send otp to phone or verify card via gateway
        isVerified: false,
      },
    })

    return {
      id: method.id,
      type: method.type,
      label: method.label,
      isDefault: method.isDefault,
      cardLast4: method.cardLast4,
      cardBrand: method.cardBrand,
      cardExpMonth: method.cardExpMonth,
      cardExpYear: method.cardExpYear,
      mobileOperator: method.mobileOperator,
      mobileNumber: method.mobileNumber
        ? this.maskPhone(method.mobileNumber)
        : null,
      isVerified: method.isVerified,
      createdAt: method.createdAt.toISOString(),
    }
  }

  async verifyPaymentMethod(
    methodId: string,
    patientId: string,
    _verificationCode: string,
  ): Promise<SavedPaymentMethodResult> {
    const method = await prisma.savedPaymentMethod.findUnique({
      where: { id: methodId },
    })

    if (!method) {
      throw new Error('Moyen de paiement non trouvé')
    }

    if (method.patientId !== patientId) {
      throw new Error("Vous n'avez pas accès à ce moyen de paiement")
    }

    if (method.isVerified) {
      throw new Error('Ce moyen de paiement est déjà vérifié')
    }

    // todo : in prod validate otp / card verification via payment gateway
    // for now we accept any 4-8 digit code as valid
    const updated = await prisma.savedPaymentMethod.update({
      where: { id: methodId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    })

    return {
      id: updated.id,
      type: updated.type,
      label: updated.label,
      isDefault: updated.isDefault,
      cardLast4: updated.cardLast4,
      cardBrand: updated.cardBrand,
      cardExpMonth: updated.cardExpMonth,
      cardExpYear: updated.cardExpYear,
      mobileOperator: updated.mobileOperator,
      mobileNumber: updated.mobileNumber
        ? this.maskPhone(updated.mobileNumber)
        : null,
      isVerified: updated.isVerified,
      createdAt: updated.createdAt.toISOString(),
    }
  }

  async deletePaymentMethod(
    methodId: string,
    patientId: string,
  ): Promise<void> {
    const method = await prisma.savedPaymentMethod.findUnique({
      where: { id: methodId },
    })

    if (!method) {
      throw new Error('Moyen de paiement non trouvé')
    }

    if (method.patientId !== patientId) {
      throw new Error("Vous n'avez pas accès à ce moyen de paiement")
    }

    await prisma.savedPaymentMethod.delete({ where: { id: methodId } })
  }

  async setDefaultPaymentMethod(
    methodId: string,
    patientId: string,
  ): Promise<void> {
    const method = await prisma.savedPaymentMethod.findUnique({
      where: { id: methodId },
    })

    if (!method) {
      throw new Error('Moyen de paiement non trouvé')
    }

    if (method.patientId !== patientId) {
      throw new Error("Vous n'avez pas accès à ce moyen de paiement")
    }

    // unset other defaults and set this one
    await prisma.$transaction([
      prisma.savedPaymentMethod.updateMany({
        where: { patientId, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.savedPaymentMethod.update({
        where: { id: methodId },
        data: { isDefault: true },
      }),
    ])
  }

  // invoice pdf generate
  async generateInvoicePdf(
    invoiceId: string,
    patientId: string,
  ): Promise<Buffer> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payment: {
          include: {
            patient: true,
            practitioner: true,
            appointment: true,
          },
        },
      },
    })

    if (!invoice) {
      throw new Error('Facture non trouvée')
    }

    if (invoice.payment.patientId !== patientId) {
      throw new Error("Vous n'avez pas accès à cette facture")
    }

    // generate pdf
    const pdf = await this.buildInvoicePdfContent(invoice)
    return pdf
  }

  // utils
  private maskPhone(phone: string): string {
    if (phone.length <= 4) return phone
    const visible = phone.slice(-4)
    const masked = '*'.repeat(phone.length - 4)
    return `${masked}${visible}`
  }

  private async buildInvoicePdfContent(invoice: any): Promise<Buffer> {
    // build structured text/html receipt that can easily rendered as pdf in the front
    // todo : in prod use a service like puppeteer or wkhtmltopdf
    const items = (invoice.items as any[]) || []
    const paymentMethodLabels: Record<string, string> = {
      CARD: 'Carte bancaire',
      MOBILE_MONEY: 'Mobile Money',
      CASH: 'Espèces',
      PAYPAL: 'PayPal',
    }

    const aptDate = new Date(invoice.payment.appointment.appointmentDate)
    const formattedDate = aptDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #FF8200; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: bold; color: #FF8200; }
    .logo span { color: #009A44; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { color: #FF8200; font-size: 20px; margin-bottom: 8px; }
    .invoice-info p { color: #666; font-size: 13px; line-height: 1.6; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .party { width: 48%; }
    .party h3 { font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 10px; }
    .party p { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead th { background: #009A44; color: white; padding: 12px 16px; text-align: left; font-size: 13px; }
    tbody td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-table .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .totals-table .total { border-top: 2px solid #1a1a1a; font-weight: bold; font-size: 18px; padding-top: 12px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-completed { background: #E6F5EB; color: #006B30; }
    .status-refunded { background: #FFF5E6; color: #B35900; }
    .payment-info { background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 30px; }
    .payment-info p { font-size: 13px; color: #555; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Medi<span>Cote</span></div>
      <p style="color: #888; font-size: 13px; margin-top: 4px;">Plateforme de santé numérique</p>
    </div>
    <div class="invoice-info">
      <h2>FACTURE</h2>
      <p>N° ${invoice.invoiceNumber}</p>
      <p>Date : ${new Date(invoice.invoiceDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p><span class="status status-${invoice.payment.status === 'COMPLETED' ? 'completed' : 'refunded'}">${invoice.payment.status === 'COMPLETED' ? 'Payée' : 'Remboursée'}</span></p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>Facturé à</h3>
      <p><strong>${invoice.billedToName}</strong></p>
      ${invoice.billedToAddress ? `<p>${invoice.billedToAddress}</p>` : ''}
      ${invoice.billedToEmail ? `<p>${invoice.billedToEmail}</p>` : ''}
      ${invoice.billedToPhone ? `<p>${invoice.billedToPhone}</p>` : ''}
    </div>
    <div class="party">
      <h3>Émise par</h3>
      <p><strong>${invoice.billedFromName}</strong></p>
      ${invoice.billedFromAddress ? `<p>${invoice.billedFromAddress}</p>` : ''}
      ${invoice.billedFromLicense ? `<p>N° Licence : ${invoice.billedFromLicense}</p>` : ''}
    </div>
  </div>

  <div class="payment-info">
    <p><strong>Rendez-vous :</strong> ${formattedDate} à ${invoice.payment.appointment.startTime}</p>
    <p><strong>Type :</strong> ${invoice.payment.appointment.type === 'TELECONSULTATION' ? 'Téléconsultation' : 'Consultation en cabinet'}</p>
    <p><strong>Moyen de paiement :</strong> ${paymentMethodLabels[invoice.payment.method] || invoice.payment.method}</p>
    ${invoice.payment.paidAt ? `<p><strong>Payé le :</strong> ${new Date(invoice.payment.paidAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qté</th>
        <th>Prix unitaire</th>
        <th>Montant</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item: any) => `
      <tr>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>${Number(item.unitPrice).toLocaleString('fr-FR')} FCFA</td>
        <td>${Number(item.amount).toLocaleString('fr-FR')} FCFA</td>
      </tr>
      `,
        )
        .join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="row">
        <span>Sous-total</span>
        <span>${Number(invoice.subtotal).toLocaleString('fr-FR')} FCFA</span>
      </div>
      <div class="row">
        <span>TVA (${Number(invoice.taxRate)}%)</span>
        <span>${Number(invoice.taxAmount).toLocaleString('fr-FR')} FCFA</span>
      </div>
      <div class="row total">
        <span>Total</span>
        <span>${Number(invoice.total).toLocaleString('fr-FR')} FCFA</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>MediCote - Plateforme de santé numérique - Côte d'Ivoire</p>
    <p>Cette facture a été générée automatiquement et est valide sans signature.</p>
  </div>
</body>
</html>`
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBufferArray = await page.pdf({
      format: 'A4',
      printBackground: true,
    })
    await browser.close()

    return Buffer.from(pdfBufferArray)
  }

  async getPractitionerInvoices(
    practitionerId: string,
    page = 1,
    limit = 10,
    search?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit
    const where: any = { practitionerId, invoice: { isNot: null } }

    if (status && status !== 'all') {
      where.status = status.toUpperCase() as PaymentStatus
    }

    if (search) {
      where.appointment = {
        patient: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        },
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: {
            include: {
              patient: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          invoice: {
            select: { id: true, invoiceNumber: true, pdfPath: true },
          },
        },
      }),
      prisma.payment.count({ where }),
    ])

    return {
      data: payments.map((p) => ({
        id: p.id,
        appointmentId: p.appointmentId,
        amount: Number(p.amount),
        currency: p.currency,
        method: p.method,
        status: p.status,
        patientName: p.appointment.patient
          ? `${p.appointment.patient.firstName} ${p.appointment.patient.lastName}`
          : 'Anonyme',
        appointmentType: p.appointment.type,
        invoiceNumber: p.invoice?.invoiceNumber,
        paidAt: p.paidAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
        invoice: p.invoice,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async createCabinetPayment(
    practitionerId: string,
    appointmentId: string,
    amount: number,
    methodStr: string,
    notes?: string,
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        payment: true,
        patient: { include: { user: { select: { email: true } } } },
        practitioner: true,
      },
    })

    if (!appointment) throw new Error('Rendez-vous non trouvé')
    if (appointment.practitionerId !== practitionerId)
      throw new Error('Accès refusé')
    if (appointment.payment && appointment.payment.status === 'COMPLETED')
      throw new Error('Ce rendez-vous a déjà été facturé')
    if (appointment.status === 'CANCELLED')
      throw new Error('Rendez-vous annulé')

    const now = new Date()

    // if a pending payment exists, complete it instead of creating a new one
    if (appointment.payment && appointment.payment.status === 'PENDING') {
      return this.completePendingCabinetPayment(
        appointment.payment,
        appointment,
        methodStr,
        now,
        amount,
        notes,
      )
    }

    // unique invoice number CAB-YYYYMMDD-XXXX
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.payment.count()
    const invoiceNumber = `CAB-${dateStr}-${(count + 1).toString().padStart(4, '0')}`

    const payment = await prisma.payment.create({
      data: {
        appointmentId,
        patientId: appointment.patientId,
        practitionerId,
        amount,
        currency: 'XOF',
        method: methodStr as PaymentMethod,
        status: 'COMPLETED',
        invoiceNumber,
        paidAt: now,
      },
    })

    const invoice = await prisma.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNumber,
        invoiceDate: now,
        subtotal: amount,
        taxRate: 0,
        taxAmount: 0,
        total: amount,
        currency: 'XOF',
        items: [
          {
            description: notes
              ? `Consultation En cabinet - ${appointment.practitioner.title} ${appointment.practitioner.lastName} - ${notes}`
              : `Consultation En cabinet - ${appointment.practitioner.title} ${appointment.practitioner.lastName}`,
            quantity: 1,
            unitPrice: amount,
            amount: amount,
          },
        ],
        billedToName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        billedToAddress: appointment.patient.address || null,
        billedToEmail: appointment.patient.user.email,
        billedToPhone: appointment.patient.phone,
        billedFromName: `${appointment.practitioner.title} ${appointment.practitioner.firstName} ${appointment.practitioner.lastName}`,
        billedFromAddress: appointment.practitioner.address || null,
        billedFromLicense: appointment.practitioner.licenseNumber,
      },
    })

    // send email with pdf on joint piece
    try {
      const pdfBuffer = await this.buildInvoicePdfContent({
        ...invoice,
        payment: {
          ...payment,
          appointment,
        },
      })

      await sendInvoiceEmail(
        appointment.patient.user.email,
        {
          patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          invoiceNumber: invoice.invoiceNumber,
          amount: amount,
          date: new Date(invoice.invoiceDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        },
        pdfBuffer,
      )
    } catch (err) {
      console.error('Failed to send invoice email after cabinet payment:', err)
      // dont fail
    }

    return { ...payment, invoice }
  }

  // complete a pending payment for cabinet billing
  private async completePendingCabinetPayment(
    existingPayment: any,
    appointment: any,
    methodStr: string,
    now: Date,
    amount: number,
    notes?: string,
  ) {
    const payment = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        amount,
        method: methodStr as PaymentMethod,
        status: 'COMPLETED',
        paidAt: now,
      },
    })

    // Create invoice if it doesn't exist
    let invoice = await prisma.invoice.findUnique({
      where: { paymentId: payment.id },
    })

    if (!invoice) {
      invoice = await prisma.invoice.create({
        data: {
          paymentId: payment.id,
          invoiceNumber: payment.invoiceNumber,
          invoiceDate: now,
          subtotal: amount,
          taxRate: 0,
          taxAmount: 0,
          total: amount,
          currency: 'XOF',
          items: [
            {
              description: notes
                ? `Consultation En cabinet - ${appointment.practitioner.title} ${appointment.practitioner.lastName} - ${notes}`
                : `Consultation En cabinet - ${appointment.practitioner.title} ${appointment.practitioner.lastName}`,
              quantity: 1,
              unitPrice: amount,
              amount: amount,
            },
          ],
          billedToName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          billedToAddress: appointment.patient.address || null,
          billedToEmail: appointment.patient.user.email,
          billedToPhone: appointment.patient.phone,
          billedFromName: `${appointment.practitioner.title} ${appointment.practitioner.firstName} ${appointment.practitioner.lastName}`,
          billedFromAddress: appointment.practitioner.address || null,
          billedFromLicense: appointment.practitioner.licenseNumber,
        },
      })
    }

    // send email with pdf
    try {
      const pdfBuffer = await this.buildInvoicePdfContent({
        ...invoice,
        payment: {
          ...payment,
          appointment,
        },
      })

      await sendInvoiceEmail(
        appointment.patient.user.email,
        {
          patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          invoiceNumber: invoice.invoiceNumber,
          amount: amount,
          date: new Date(invoice.invoiceDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        },
        pdfBuffer,
      )
    } catch (err) {
      console.error(
        'Failed to send invoice email after completing pending payment:',
        err,
      )
    }

    return { ...payment, invoice }
  }

  async getPractitionerUnpaidAppointments(practitionerId: string) {
    // get appointments that are completed or past their date without a completed payment
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const now = new Date()

    const appointments = await prisma.appointment.findMany({
      where: {
        practitionerId,
        OR: [
          { payment: null }, // no payment exists
          { payment: { status: 'PENDING' } }, // payment is pending
        ],
        AND: {
          OR: [
            { status: 'COMPLETED' },
            {
              status: { in: ['CONFIRMED', 'PENDING'] },
              appointmentDate: { lt: today },
            },
            {
              status: { in: ['CONFIRMED', 'PENDING'] },
              appointmentDate: today,
            },
          ],
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            invoiceNumber: true,
          },
        },
      },
      orderBy: {
        appointmentDate: 'desc',
      },
    })

    // filter todays appointments by checking time
    const filtered = appointments.filter((apt) => {
      if (apt.status === 'COMPLETED') return true
      const aptDate = new Date(apt.appointmentDate)
      if (aptDate < today) return true

      if (aptDate.getTime() === today.getTime()) {
        const [hours, minutes] = apt.endTime.split(':').map(Number)
        const appointmentEndTime = new Date(today)
        appointmentEndTime.setHours(hours, minutes, 0, 0)
        return appointmentEndTime < now
      }
      return false
    })

    return filtered
  }

  async getPractitionerInvoiceDetail(
    invoiceId: string,
    practitionerId: string,
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payment: {
          include: {
            appointment: {
              include: {
                patient: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    })

    if (!invoice) throw new Error('Facture non trouvée')
    if (invoice.payment.practitionerId !== practitionerId)
      throw new Error('Accès refusé')

    return invoice
  }

  async generatePractitionerInvoicePdf(
    invoiceId: string,
    practitionerId: string,
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payment: {
          include: { patient: true, practitioner: true, appointment: true },
        },
      },
    })

    if (!invoice) throw new Error('Facture non trouvée')
    if (invoice.payment.practitionerId !== practitionerId)
      throw new Error('Accès refusé')

    return await this.buildInvoicePdfContent(invoice)
  }
}

export const paymentsService = new PaymentsService()
