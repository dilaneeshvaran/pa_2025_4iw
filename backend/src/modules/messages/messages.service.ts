import prisma from '../../config/database'
import { encrypt, decrypt } from '../../utils/crypto'
import {
  ConversationSummary,
  MessageResponse,
  ConversationDetail,
} from './messages.types'

export class MessagesService {
  async isPatientLinkedToPractitioner(
    patientId: string,
    practitionerId: string,
  ): Promise<boolean> {
    const appointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        practitionerId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
    })
    return !!appointment
  }

  async isPractitionerMessagingEnabled(
    practitionerId: string,
  ): Promise<boolean> {
    const practitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
      select: { messagingEnabled: true },
    })
    return practitioner?.messagingEnabled ?? false
  }

  async getOrCreateConversation(
    patientId: string,
    practitionerId: string,
  ): Promise<string> {
    const existing = await prisma.conversation.findUnique({
      where: {
        patientId_practitionerId: {
          patientId,
          practitionerId,
        },
      },
    })

    if (existing) return existing.id

    const conversation = await prisma.conversation.create({
      data: {
        patientId,
        practitionerId,
      },
    })

    return conversation.id
  }

  // send a message in a conversation (content is encrypted before storage)
  async sendMessage(
    conversationId: string,
    senderUserId: string,
    content: string,
  ): Promise<MessageResponse> {
    const encryptedContent = encrypt(content)

    // create the message and update conversation atomically (atomic for noob bros : all or nothing )
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderUserId,
          content: encryptedContent,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: encrypt(
            content.length > 100 ? content.substring(0, 100) + '…' : content,
          ),
        },
      }),
    ])

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderUserId: message.senderUserId,
      content, // return plain text to the sender
      status: message.status,
      readAt: message.readAt?.toISOString() ?? null,
      createdAt: message.createdAt.toISOString(),
    }
  }

  async getPatientConversations(
    userId: string,
  ): Promise<ConversationSummary[]> {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!patient) return []

    const conversations = await prisma.conversation.findMany({
      where: { patientId: patient.id },
      include: {
        practitioner: {
          include: {
            specialties: {
              where: { isPrimary: true },
              include: { specialty: true },
            },
          },
        },
        messages: {
          where: {
            senderUserId: { not: userId },
            status: { not: 'READ' },
          },
          select: { id: true },
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    })

    return conversations.map((c) => ({
      id: c.id,
      practitionerId: c.practitionerId,
      practitionerFirstName: c.practitioner.firstName,
      practitionerLastName: c.practitioner.lastName,
      practitionerTitle: c.practitioner.title,
      practitionerSpecialty:
        c.practitioner.specialties[0]?.specialty?.name ?? null,
      lastMessagePreview: c.lastMessagePreview
        ? this.safeDecrypt(c.lastMessagePreview)
        : null,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      unreadCount: c.messages.length,
    }))
  }

  async getPractitionerConversations(userId: string) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!practitioner) return []

    const conversations = await prisma.conversation.findMany({
      where: { practitionerId: practitioner.id },
      include: {
        patient: true,
        messages: {
          where: {
            senderUserId: { not: userId },
            status: { not: 'READ' },
          },
          select: { id: true },
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    })

    return conversations.map((c) => ({
      id: c.id,
      patientId: c.patientId,
      patientFirstName: c.patient.firstName,
      patientLastName: c.patient.lastName,
      lastMessagePreview: c.lastMessagePreview
        ? this.safeDecrypt(c.lastMessagePreview)
        : null,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      unreadCount: c.messages.length,
    }))
  }

  //get a conversation with messages (decrypted)
  async getConversation(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit = 50,
  ): Promise<ConversationDetail | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        practitioner: {
          include: {
            user: { select: { id: true } },
            specialties: {
              where: { isPrimary: true },
              include: { specialty: true },
            },
          },
        },
        patient: {
          include: {
            user: { select: { id: true } },
          },
        },
      },
    })

    if (!conversation) return null

    // verify user is part of  conversation
    const patientUserId = conversation.patient.user.id
    const practitionerUserId = conversation.practitioner.user.id

    if (userId !== patientUserId && userId !== practitionerUserId) {
      return null
    }

    //  messages with cursor based pagination
    // (cursor based :  cursor is  createdAt of the last message of  previous pageso fetch messages created before that)
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // mark unread messages from the other side as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderUserId: { not: userId },
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    })

    return {
      id: conversation.id,
      patientId: conversation.patientId,
      practitionerId: conversation.practitionerId,
      practitioner: {
        id: conversation.practitioner.id,
        firstName: conversation.practitioner.firstName,
        lastName: conversation.practitioner.lastName,
        title: conversation.practitioner.title,
        specialty:
          conversation.practitioner.specialties[0]?.specialty?.name ?? null,
        messagingEnabled: conversation.practitioner.messagingEnabled,
      },
      patient: {
        id: conversation.patient.id,
        firstName: conversation.patient.firstName,
        lastName: conversation.patient.lastName,
      },
      messages: messages.reverse().map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderUserId: m.senderUserId,
        content: this.safeDecrypt(m.content),
        status: m.status,
        readAt: m.readAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      })),
    }
  }

  // validate that user can access this conversation
  async validateConversationAccess(
    conversationId: string,
    userId: string,
  ): Promise<{ valid: boolean; conversation?: any }> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        patient: { include: { user: { select: { id: true } } } },
        practitioner: { include: { user: { select: { id: true } } } },
      },
    })

    if (!conversation) return { valid: false }

    const patientUserId = conversation.patient.user.id
    const practitionerUserId = conversation.practitioner.user.id

    if (userId !== patientUserId && userId !== practitionerUserId) {
      return { valid: false }
    }

    return { valid: true, conversation }
  }

  //  practitioners that a patient have access to message (linked + messaging enabled)
  async getMessagablePractitioners(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!patient) return []

    // find  practitioners the patient has had confirmed/completed appointments with
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      select: { practitionerId: true },
      distinct: ['practitionerId'],
    })

    const practitionerIds = appointments.map((a) => a.practitionerId)

    if (practitionerIds.length === 0) return []

    const practitioners = await prisma.practitioner.findMany({
      where: {
        id: { in: practitionerIds },
        messagingEnabled: true,
      },
      include: {
        specialties: {
          where: { isPrimary: true },
          include: { specialty: true },
        },
      },
    })

    return practitioners.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      title: p.title,
      specialty: p.specialties[0]?.specialty?.name ?? null,
    }))
  }

  async getPatientIdFromUserId(userId: string): Promise<string | null> {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })
    return patient?.id ?? null
  }

  async getPractitionerIdFromUserId(userId: string): Promise<string | null> {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
      select: { id: true },
    })
    return practitioner?.id ?? null
  }

  // mark all messages in a conversation as read for user
  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderUserId: { not: userId },
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    })
    return result.count
  }

  // get total unread message count for a user (for notifications)
  async getUnreadCount(userId: string, role: string): Promise<number> {
    if (role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId },
        select: { id: true },
      })
      if (!patient) return 0

      const conversations = await prisma.conversation.findMany({
        where: { patientId: patient.id },
        select: { id: true },
      })

      if (conversations.length === 0) return 0

      return prisma.message.count({
        where: {
          conversationId: { in: conversations.map((c) => c.id) },
          senderUserId: { not: userId },
          status: { not: 'READ' },
        },
      })
    } else {
      const practitioner = await prisma.practitioner.findUnique({
        where: { userId },
        select: { id: true },
      })
      if (!practitioner) return 0

      const conversations = await prisma.conversation.findMany({
        where: { practitionerId: practitioner.id },
        select: { id: true },
      })

      if (conversations.length === 0) return 0

      return prisma.message.count({
        where: {
          conversationId: { in: conversations.map((c) => c.id) },
          senderUserId: { not: userId },
          status: { not: 'READ' },
        },
      })
    }
  }

  private safeDecrypt(text: string): string {
    try {
      return decrypt(text)
    } catch {
      // If decryption fails thenwe  return the text as is (might be  unencrypted data)
      return text
    }
  }
}

export const messagesService = new MessagesService()
