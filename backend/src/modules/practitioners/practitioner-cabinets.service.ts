import prisma from '../../config/database'

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

    // check if practitioner already has an active cabinet
    const activeCabinet = await prisma.cabinetPractitioner.findFirst({
      where: {
        practitionerId: practitioner.id,
        leftAt: null,
      },
    })

    if (activeCabinet) {
      throw new Error(
        "Vous appartenez déjà à un cabinet. Veuillez le quitter d'abord.",
      )
    }

    return await prisma.$transaction(async (tx) => {
      // update invitation
      const updatedInvitation = await tx.cabinetInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      })

      // add to cabinet (upsert to handle rejoining)
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

    // try to find the active association
    const cabinetPractitioner = await prisma.cabinetPractitioner.findFirst({
      where: {
        cabinetId: cabinetId,
        practitionerId: practitioner.id,
        leftAt: null,
      },
    })

    if (!cabinetPractitioner) {
      throw new Error('Not a member of this cabinet')
    }

    return await prisma.cabinetPractitioner.update({
      where: { id: cabinetPractitioner.id },
      data: {
        leftAt: new Date(),
      },
    })
  }

  async togglePauseCabinet(userId: string, cabinetId: string) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
    })

    if (!practitioner) {
      throw new Error('Practitioner not found')
    }

    // finding the active association
    const cabinetPractitioner = await prisma.cabinetPractitioner.findFirst({
      where: {
        cabinetId: cabinetId,
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
}

export const practitionerCabinetsService = new PractitionerCabinetsService()
