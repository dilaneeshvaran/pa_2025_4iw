import prisma from '../../config/database'
import { encrypt, decrypt } from '../../utils/crypto'
import {
  ConversationSummary,
  ConversationSummaryForPractitioner,
  MessageResponse,
  ConversationDetail,
  MessageAttachment,
} from './messages.types'
import { sendEmail } from '../../utils/email'

// pending email notifications conversationId:userId -> timeout
const pendingEmailNotifications = new Map<
  string,
  ReturnType<typeof setTimeout>
>()

// default to instant email notification for offline recipients
const rawEmailDelay = Number(process.env.BACKEND_MESSAGE_EMAIL_DELAY_MS ?? '0')
const EMAIL_NOTIFICATION_DELAY_MS =
  Number.isFinite(rawEmailDelay) && rawEmailDelay >= 0 ? rawEmailDelay : 0

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
    initiatorUserId?: string,
  ): Promise<string> {
    const existing = await prisma.conversation.findUnique({
      where: {
        patientId_practitionerId: {
          patientId,
          practitionerId,
        },
      },
    })

    if (existing) {
      // clear  soft delete so  conversation reappears
      if (initiatorUserId) {
        await prisma.conversationUserSettings.updateMany({
          where: {
            conversationId: existing.id,
            userId: initiatorUserId,
            deletedAt: { not: null },
          },
          data: { deletedAt: null },
        })
      }
      return existing.id
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: 'PATIENT_PRACTITIONER',
        patientId,
        practitionerId,
      },
    })

    return conversation.id
  }

  async getOrCreatePractitionerConversation(
    practitionerId: string,
    practitioner2Id: string,
    initiatorUserId?: string,
  ): Promise<string> {
    // consistent ordering to avoid duplicate
    const [id1, id2] =
      practitionerId < practitioner2Id
        ? [practitionerId, practitioner2Id]
        : [practitioner2Id, practitionerId]

    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'PRACTITIONER_PRACTITIONER',
        practitionerId: id1,
        practitioner2Id: id2,
      },
    })

    if (existing) {
      // Clear  soft delete so  conversation reappears
      if (initiatorUserId) {
        await prisma.conversationUserSettings.updateMany({
          where: {
            conversationId: existing.id,
            userId: initiatorUserId,
            deletedAt: { not: null },
          },
          data: { deletedAt: null },
        })
      }
      return existing.id
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: 'PRACTITIONER_PRACTITIONER',
        practitionerId: id1,
        practitioner2Id: id2,
      },
    })

    return conversation.id
  }

  // send a message in a conversation (content is encrypted before storage)
  async sendMessage(
    conversationId: string,
    senderUserId: string,
    content: string,
    attachments?: MessageAttachment[] | null,
  ): Promise<MessageResponse> {
    const encryptedContent = encrypt(content)

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderUserId,
          content: encryptedContent,
          attachments: attachments
            ? JSON.parse(JSON.stringify(attachments))
            : undefined,
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
      content,
      attachments: attachments ?? null,
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
      where: {
        patientId: patient.id,
        type: 'PATIENT_PRACTITIONER',
        // exclude soft deleted conv
        NOT: {
          userSettings: {
            some: {
              userId,
              deletedAt: { not: null },
            },
          },
        },
      },
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
      type: c.type,
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

  async getPractitionerConversations(
    userId: string,
  ): Promise<ConversationSummaryForPractitioner[]> {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!practitioner) return []

    //  all conversations where  practitioner is involved (as practitioner or practitioner2)
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { practitionerId: practitioner.id },
          { practitioner2Id: practitioner.id },
        ],
        NOT: {
          userSettings: {
            some: {
              userId,
              deletedAt: { not: null },
            },
          },
        },
      },
      include: {
        patient: true,
        practitioner: {
          include: {
            user: { select: { id: true } },
            specialties: {
              where: { isPrimary: true },
              include: { specialty: true },
            },
          },
        },
        practitioner2: {
          include: {
            user: { select: { id: true } },
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
        userSettings: {
          where: { userId },
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    })

    return conversations.map((c) => {
      const emailMuted = c.userSettings[0]?.emailMuted ?? false

      if (c.type === 'PRACTITIONER_PRACTITIONER') {
        // find "other" practitioner
        const isInitiator = c.practitionerId === practitioner.id
        const other = isInitiator ? c.practitioner2 : c.practitioner

        return {
          id: c.id,
          type: c.type,
          otherPractitionerId: other?.id,
          otherPractitionerFirstName: other?.firstName,
          otherPractitionerLastName: other?.lastName,
          otherPractitionerTitle: other?.title,
          otherPractitionerSpecialty:
            other?.specialties?.[0]?.specialty?.name ?? null,
          lastMessagePreview: c.lastMessagePreview
            ? this.safeDecrypt(c.lastMessagePreview)
            : null,
          lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
          unreadCount: c.messages.length,
          emailMuted,
        }
      }

      return {
        id: c.id,
        type: c.type,
        patientId: c.patientId!,
        patientFirstName: c.patient!.firstName,
        patientLastName: c.patient!.lastName,
        lastMessagePreview: c.lastMessagePreview
          ? this.safeDecrypt(c.lastMessagePreview)
          : null,
        lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
        unreadCount: c.messages.length,
        emailMuted,
      }
    })
  }

  // get a conversation with messages (decrypted)
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
        practitioner2: {
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
        userSettings: {
          where: { userId },
        },
      },
    })

    if (!conversation) return null

    // verify user is part of conversation
    const allowedUserIds = [
      conversation.patient?.user?.id,
      conversation.practitioner.user.id,
      conversation.practitioner2?.user?.id,
    ].filter(Boolean)

    if (!allowedUserIds.includes(userId)) {
      return null
    }

    // messages with cursor based pagination
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // mark unread messages from the other side as read
    const markedCount = await prisma.message.updateMany({
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

    // cancel  pending email notifs for messages in this conv for this user
    if (markedCount.count > 0) {
      this.cancelPendingEmailNotifications(conversationId, userId)
    }

    const emailMuted = conversation.userSettings[0]?.emailMuted ?? false

    return {
      id: conversation.id,
      type: conversation.type,
      patientId: conversation.patientId,
      practitionerId: conversation.practitionerId,
      practitioner2Id: conversation.practitioner2Id,
      practitioner: {
        id: conversation.practitioner.id,
        userId: conversation.practitioner.user.id,
        firstName: conversation.practitioner.firstName,
        lastName: conversation.practitioner.lastName,
        title: conversation.practitioner.title,
        specialty:
          conversation.practitioner.specialties[0]?.specialty?.name ?? null,
        messagingEnabled: conversation.practitioner.messagingEnabled,
      },
      practitioner2: conversation.practitioner2
        ? {
            id: conversation.practitioner2.id,
            userId: conversation.practitioner2.user.id,
            firstName: conversation.practitioner2.firstName,
            lastName: conversation.practitioner2.lastName,
            title: conversation.practitioner2.title,
            specialty:
              conversation.practitioner2.specialties[0]?.specialty?.name ??
              null,
          }
        : null,
      patient: conversation.patient
        ? {
            id: conversation.patient.id,
            userId: conversation.patient.user.id,
            firstName: conversation.patient.firstName,
            lastName: conversation.patient.lastName,
          }
        : null,
      messages: messages.reverse().map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderUserId: m.senderUserId,
        content: this.safeDecrypt(m.content),
        attachments: m.attachments as MessageAttachment[] | null,
        status: m.status,
        readAt: m.readAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      })),
      emailMuted,
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
        practitioner2: { include: { user: { select: { id: true } } } },
      },
    })

    if (!conversation) return { valid: false }

    const allowedUserIds = [
      conversation.patient?.user?.id,
      conversation.practitioner.user.id,
      conversation.practitioner2?.user?.id,
    ].filter(Boolean)

    if (!allowedUserIds.includes(userId)) {
      return { valid: false }
    }

    return { valid: true, conversation }
  }

  // practitioners that a patient can message (linked + messaging enabled)
  async getMessagablePractitioners(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!patient) return []

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

  // get patients that a practitioner can message (patients with appointments)
  async getMessagablePatients(userId: string) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!practitioner) return []

    const appointments = await prisma.appointment.findMany({
      where: {
        practitionerId: practitioner.id,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      select: { patientId: true },
      distinct: ['patientId'],
    })

    const patientIds = appointments.map((a) => a.patientId)
    if (patientIds.length === 0) return []

    const patients = await prisma.patient.findMany({
      where: {
        id: { in: patientIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    })

    return patients.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
    }))
  }

  //  practitioners that another practitioner can message (messagingEnabled = true)
  async getMessagablePractitionersForPractitioner(userId: string) {
    const currentPractitioner = await prisma.practitioner.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!currentPractitioner) return []

    const practitioners = await prisma.practitioner.findMany({
      where: {
        messagingEnabled: true,
        id: { not: currentPractitioner.id },
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

    // cancel pending email notifications
    this.cancelPendingEmailNotifications(conversationId, userId)

    return result.count
  }

  // get total unread message count for a user
  async getUnreadCount(userId: string, role: string): Promise<number> {
    if (role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId },
        select: { id: true },
      })
      if (!patient) return 0

      const conversations = await prisma.conversation.findMany({
        where: {
          patientId: patient.id,
          NOT: {
            userSettings: {
              some: { userId, deletedAt: { not: null } },
            },
          },
        },
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
        where: {
          OR: [
            { practitionerId: practitioner.id },
            { practitioner2Id: practitioner.id },
          ],
          NOT: {
            userSettings: {
              some: { userId, deletedAt: { not: null } },
            },
          },
        },
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

  // soft delete a conversation for a user
  async deleteConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await prisma.conversationUserSettings.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      create: {
        conversationId,
        userId,
        deletedAt: new Date(),
      },
      update: {
        deletedAt: new Date(),
      },
    })
  }

  // toggle email mute for a conversation
  async toggleEmailMute(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const existing = await prisma.conversationUserSettings.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    })

    const newValue = !(existing?.emailMuted ?? false)

    await prisma.conversationUserSettings.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      create: {
        conversationId,
        userId,
        emailMuted: newValue,
      },
      update: {
        emailMuted: newValue,
      },
    })

    return newValue
  }

  async createInAppMessageNotification(
    recipientUserId: string,
    senderName: string,
    messagePreview: string,
    conversationId: string,
    messageId: string,
  ): Promise<void> {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: recipientUserId },
      select: { newMessages: true },
    })

    if (prefs && !prefs.newMessages) return

    await prisma.notification.create({
      data: {
        userId: recipientUserId,
        type: 'MESSAGE_RECEIVED',
        channel: 'IN_APP',
        title: 'Nouveau message',
        message: `${senderName} vous a envoyé un message`,
        metadata: {
          conversationId,
          messageId,
          preview: messagePreview,
        },
        sent: true,
        sentAt: new Date(),
        deliveryStatus: 'DELIVERED',
      },
    })
  }

  // schedule a delayed email notification for a message
  async scheduleEmailNotification(
    messageId: string,
    conversationId: string,
    recipientUserId: string,
    senderName: string,
    messagePreview: string,
    isOnline: boolean,
  ): Promise<void> {
    // if user is online, dont schedule
    if (isOnline) return

    // check if email notifications are enabled for this user
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: recipientUserId },
    })
    if (prefs && (!prefs.emailNotifications || !prefs.newMessages)) return

    // check if email is muted for this conversation
    const convSettings = await prisma.conversationUserSettings.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: recipientUserId,
        },
      },
    })
    if (convSettings?.emailMuted) return

    // send instantly by default (delay can be configured via env)
    if (EMAIL_NOTIFICATION_DELAY_MS === 0) {
      try {
        await this.sendMessageEmailIfUnread(
          messageId,
          recipientUserId,
          senderName,
          messagePreview,
        )
      } catch (error) {
        console.error('Error sending message notification email:', error)
      }
      return
    }

    // schedule the email with configured delay
    const key = `${conversationId}:${recipientUserId}`

    // cancel existing pending notification for this conversation
    const existingTimeout = pendingEmailNotifications.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    const timeout = setTimeout(async () => {
      pendingEmailNotifications.delete(key)
      try {
        await this.sendMessageEmailIfUnread(
          messageId,
          recipientUserId,
          senderName,
          messagePreview,
        )
      } catch (error) {
        console.error('Error sending message notification email:', error)
      }
    }, EMAIL_NOTIFICATION_DELAY_MS)

    pendingEmailNotifications.set(key, timeout)
  }

  // cancel pending email notifications for a conversation
  cancelPendingEmailNotifications(
    conversationId: string,
    userId: string,
  ): void {
    const key = `${conversationId}:${userId}`
    const timeout = pendingEmailNotifications.get(key)
    if (timeout) {
      clearTimeout(timeout)
      pendingEmailNotifications.delete(key)
    }
  }

  private async sendMessageEmailIfUnread(
    messageId: string,
    recipientUserId: string,
    senderName: string,
    messagePreview: string,
  ): Promise<void> {
    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      select: { status: true },
    })
    if (!msg || msg.status === 'READ') return

    const user = await prisma.user.findUnique({
      where: { id: recipientUserId },
      select: { email: true },
    })
    if (!user) return

    await sendNewMessageEmail(user.email, senderName, messagePreview)
  }

  // get  recipient user ids for a conversation
  async getRecipientUserIds(
    conversationId: string,
    senderUserId: string,
  ): Promise<string[]> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        patient: { include: { user: { select: { id: true } } } },
        practitioner: { include: { user: { select: { id: true } } } },
        practitioner2: { include: { user: { select: { id: true } } } },
      },
    })

    if (!conversation) return []

    const allUserIds = [
      conversation.patient?.user?.id,
      conversation.practitioner.user.id,
      conversation.practitioner2?.user?.id,
    ].filter((id): id is string => !!id && id !== senderUserId)

    return allUserIds
  }

  //  sender display name
  async getSenderDisplayName(userId: string): Promise<string> {
    const practitioner = await prisma.practitioner.findUnique({
      where: { userId },
      select: { title: true, firstName: true, lastName: true },
    })
    if (practitioner) {
      return `${practitioner.title} ${practitioner.firstName} ${practitioner.lastName}`
    }

    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { firstName: true, lastName: true },
    })
    if (patient) {
      return `${patient.firstName} ${patient.lastName}`
    }

    return 'Utilisateur'
  }

  private safeDecrypt(text: string): string {
    try {
      return decrypt(text)
    } catch {
      return text
    }
  }
}

async function sendNewMessageEmail(
  to: string,
  senderName: string,
  messagePreview: string,
): Promise<void> {
  const APP_URL = process.env.BACKEND_APP_URL || 'http://localhost:3000'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouveau message</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">MediCôte</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #0066cc; margin-top: 0;">Nouveau message reçu</h2>
          <p>Vous avez reçu un nouveau message de <strong>${senderName}</strong>.</p>
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #555; font-style: italic;">"${messagePreview}"</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/practitioner/messages" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Voir mes messages</a>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Les messages sont chiffrés de bout en bout pour votre sécurité.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} MediCôte. Tous droits réservés.</p>
        </div>
      </body>
    </html>
  `

  await sendEmail(to, 'Nouveau message - MediCôte', html)
}

export const messagesService = new MessagesService()
