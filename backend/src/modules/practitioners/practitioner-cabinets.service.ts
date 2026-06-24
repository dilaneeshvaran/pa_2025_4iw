import prisma from '../../config/database'
import { AppointmentStatus } from '@prisma/client'
import { sendCabinetLeaveAppointmentCancelledEmail } from '../../utils/email'

class PractitionerCabinetsService {
  async getCabinetsAndInvitations(userId: string) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
    })

    if (!practitioner) {
      throw new Error('Practitioner not found')
    }

    const activeCabinets = await prisma.cabinetPractitioner.findMany({
      where: {
        practitionerId: practitioner.id,
        leftAt: null,
      },
      include: {
        cabinet: true,
      },
    })

    const invitations = await prisma.cabinetInvitation.findMany({
      where: {
        practitionerId: practitioner.id,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        cabinet: true,
      },
    })

    return {
      activeCabinets: activeCabinets.map((cp) => ({
        id: cp.id,
        cabinet: cp.cabinet,
        isPaused: cp.isPaused,
        joinedAt: cp.joinedAt,
      })),
      invitations,
    }
  }

  async acceptInvitation(userId: string, invitationId: string) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
    })

    if (!practitioner) {
      throw new Error('Practitioner not found')
    }

    const invitation = await prisma.cabinetInvitation.findUnique({
      where: { id: invitationId },
    })

    if (!invitation) {
      throw new Error('Invitation not found')
    }

    if (invitation.practitionerId !== practitioner.id) {
      throw new Error('Unauthorized')
    }

    if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      throw new Error('Invitation is not valid anymore')
    }

    const alreadyMember = await prisma.cabinetPractitioner.findFirst({
      where: {
        practitionerId: practitioner.id,
        cabinetId: invitation.cabinetId,
        leftAt: null,
      },
    })

    if (alreadyMember) {
      throw new Error('Vous êtes déjà membre de ce cabinet.')
    }

    return await prisma.$transaction(async (tx) => {
      const updatedInvitation = await tx.cabinetInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      })

      const cabinetPractitioner = await tx.cabinetPractitioner.upsert({
        where: {
          cabinetId_practitionerId: {
            cabinetId: invitation.cabinetId,
            practitionerId: practitioner.id,
          },
        },
        update: {
          leftAt: null,
          joinedAt: new Date(),
          isPaused: false,
        },
        create: {
          cabinetId: invitation.cabinetId,
          practitionerId: practitioner.id,
        },
        include: {
          cabinet: true,
        },
      })

      return {
        id: cabinetPractitioner.id,
        cabinet: cabinetPractitioner.cabinet,
        joinedAt: cabinetPractitioner.joinedAt,
        invitation: updatedInvitation,
      }
    })
  }

  async rejectInvitation(userId: string, invitationId: string) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
    })

    if (!practitioner) {
      throw new Error('Practitioner not found')
    }

    const invitation = await prisma.cabinetInvitation.findUnique({
      where: { id: invitationId },
    })

    if (!invitation) {
      throw new Error('Invitation not found')
    }

    if (invitation.practitionerId !== practitioner.id) {
      throw new Error('Unauthorized')
    }

    if (invitation.status !== 'PENDING') {
      throw new Error('Invitation already responded')
    }

    return await prisma.cabinetInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    })
  }

  async leaveCabinet(userId: string, cabinetId: string) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
    })

    if (!practitioner) {
      throw new Error('Practitioner not found')
    }

    const cabinetPractitioner = await prisma.cabinetPractitioner.findFirst({
      where: {
        cabinetId,
        practitionerId: practitioner.id,
        leftAt: null,
      },
      include: {
        cabinet: true,
      },
    })

    if (!cabinetPractitioner) {
      throw new Error('Not a member of this cabinet')
    }

    return await prisma.$transaction(async (tx) => {
      await tx.cabinetPractitioner.update({
        where: { id: cabinetPractitioner.id },
        data: { leftAt: new Date() },
      })

      await this.cancelFutureCabinetAppointments(
        tx,
        practitioner.id,
        cabinetId,
        cabinetPractitioner.cabinet.name,
        practitioner.title,
        practitioner.firstName,
        practitioner.lastName,
      )

      return { success: true }
    })
  }

  async togglePauseCabinet(userId: string, cabinetId: string) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
    })

    if (!practitioner) {
      throw new Error('Practitioner not found')
    }

    const cabinetPractitioner = await prisma.cabinetPractitioner.findFirst({
      where: {
        cabinetId,
        practitionerId: practitioner.id,
        leftAt: null,
      },
    })

    if (!cabinetPractitioner) {
      throw new Error('Not an active member of this cabinet')
    }

    return await prisma.cabinetPractitioner.update({
      where: { id: cabinetPractitioner.id },
      data: {
        isPaused: !cabinetPractitioner.isPaused,
      },
    })
  }

  async getCabinetColleagues(userId: string, cabinetId: string) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
    })

    if (!practitioner) {
      throw new Error('Practitioner not found')
    }

    const membership = await prisma.cabinetPractitioner.findFirst({
      where: {
        cabinetId,
        practitionerId: practitioner.id,
        leftAt: null,
      },
    })

    if (!membership) {
      throw new Error("Vous n'êtes pas membre de ce cabinet")
    }

    const colleagues = await prisma.cabinetPractitioner.findMany({
      where: {
        cabinetId,
        leftAt: null,
        practitionerId: { not: practitioner.id },
      },
      include: {
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            phone: true,
            specialties: {
              include: { specialty: true },
            },
          },
        },
      },
    })

    return colleagues.map((cp) => ({
      id: cp.practitioner.id,
      firstName: cp.practitioner.firstName,
      lastName: cp.practitioner.lastName,
      title: cp.practitioner.title,
      phone: cp.practitioner.phone,
      isPaused: cp.isPaused,
      joinedAt: cp.joinedAt,
      specialties: cp.practitioner.specialties.map((s) => s.specialty.name),
    }))
  }

  async cancelFutureCabinetAppointments(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    practitionerId: string,
    cabinetId: string,
    cabinetName: string,
    practitionerTitle: string,
    practitionerFirstName: string,
    practitionerLastName: string,
  ) {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const futureAppointments = await tx.appointment.findMany({
      where: {
        practitionerId,
        cabinetId,
        appointmentDate: { gte: today },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
      include: {
        patient: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    })

    if (futureAppointments.length === 0) return

    await tx.appointment.updateMany({
      where: {
        id: { in: futureAppointments.map((a) => a.id) },
      },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: 'CABINET',
        cancellationReason: `Praticien a quitté le cabinet ${cabinetName}`,
      },
    })

    for (const apt of futureAppointments) {
      if (apt.patient.user?.email) {
        const dateStr = apt.appointmentDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        try {
          await sendCabinetLeaveAppointmentCancelledEmail(
            apt.patient.user.email,
            {
              patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
              practitionerTitle,
              practitionerFirstName,
              practitionerLastName,
              cabinetName,
              appointmentDate: dateStr,
              appointmentTime: apt.startTime,
            },
          )
        } catch (emailError) {
          console.error(
            `Failed to send cancellation email for appointment ${apt.id}:`,
            emailError,
          )
        }
      }
    }
  }
}

export const practitionerCabinetsService = new PractitionerCabinetsService()
