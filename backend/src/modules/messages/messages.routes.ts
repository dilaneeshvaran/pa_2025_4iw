import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { messagesService } from './messages.service'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import {
  sendMessageSchema,
  startConversationSchema,
  getMessagesQuerySchema,
  startConversationWithPatientSchema,
  startConversationWithPractitionerSchema,
} from './messages.schema'
import {
  saveMessageAttachment,
  getAttachmentPath,
  FILE_CONSTRAINTS,
} from '../../utils/file-upload'
import { sendToUser } from '../../plugins/websocket'
import path from 'path'
import fs from 'fs'

export async function messagesRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/conversations',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }

        let conversations
        if (user.role === 'PATIENT') {
          conversations = await messagesService.getPatientConversations(user.id)
        } else if (user.role === 'PRACTITIONER' || user.role === 'STAFF') {
          conversations = await messagesService.getPractitionerConversations(
            user.id,
          )
        } else {
          return reply.status(403).send({
            success: false,
            message: 'Accès non autorisé',
          })
        }

        return reply.status(200).send({
          success: true,
          data: conversations,
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la récupération des conversations',
        })
      }
    },
  )

  fastify.get(
    '/conversations/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const params = request.params as { id: string }
        const id = params.id
        const query = getMessagesQuerySchema.parse(request.query)

        const conversation = await messagesService.getConversation(
          id,
          user.id,
          query.cursor,
          query.limit,
        )

        if (!conversation) {
          return reply.status(404).send({
            success: false,
            message: 'Conversation introuvable',
          })
        }

        // keep read receipts in sync when a user opens a conversation
        if (!query.cursor) {
          const recipientIds = await messagesService.getRecipientUserIds(
            id,
            user.id,
          )
          for (const recipientId of recipientIds) {
            sendToUser(recipientId, 'messages_read', { conversationId: id })
          }
        }

        return reply.status(200).send({
          success: true,
          data: conversation,
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la récupération de la conversation',
        })
      }
    },
  )

  // patient  new conversation with  practitioner
  fastify.post(
    '/conversations',
    { preHandler: [authenticate, authorize(['PATIENT'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = startConversationSchema.parse(request.body)

        const patientId = await messagesService.getPatientIdFromUserId(user.id)
        if (!patientId) {
          return reply.status(400).send({
            success: false,
            message: 'Profil patient introuvable',
          })
        }

        const messagingEnabled =
          await messagesService.isPractitionerMessagingEnabled(
            body.practitionerId,
          )
        if (!messagingEnabled) {
          return reply.status(403).send({
            success: false,
            message: "Ce praticien n'a pas activé la messagerie",
          })
        }

        const isLinked = await messagesService.isPatientLinkedToPractitioner(
          patientId,
          body.practitionerId,
        )
        if (!isLinked) {
          return reply.status(403).send({
            success: false,
            message:
              'Vous devez avoir eu un rendez-vous avec ce praticien pour lui envoyer un message',
          })
        }

        const conversationId = await messagesService.getOrCreateConversation(
          patientId,
          body.practitionerId,
          user.id,
        )

        const message = await messagesService.sendMessage(
          conversationId,
          user.id,
          body.content,
        )

        // notify via ws + schedule email
        await notifyRecipients(fastify, conversationId, user.id, message)

        return reply.status(201).send({
          success: true,
          data: { conversationId, message },
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: "Erreur lors de l'envoi du message",
        })
      }
    },
  )

  // practitioner starts a conversation with a patient
  fastify.post(
    '/conversations/with-patient',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = startConversationWithPatientSchema.parse(request.body)

        const practitionerId =
          await messagesService.getPractitionerIdFromUserId(user.id)
        if (!practitionerId) {
          return reply.status(400).send({
            success: false,
            message: 'Profil praticien introuvable',
          })
        }

        // check if patient is linked to this practitioner
        const isLinked = await messagesService.isPatientLinkedToPractitioner(
          body.patientId,
          practitionerId,
        )
        if (!isLinked) {
          return reply.status(403).send({
            success: false,
            message:
              "Vous ne pouvez envoyer un message qu'à vos propres patients",
          })
        }

        const conversationId = await messagesService.getOrCreateConversation(
          body.patientId,
          practitionerId,
          user.id,
        )

        const message = await messagesService.sendMessage(
          conversationId,
          user.id,
          body.content,
        )

        await notifyRecipients(fastify, conversationId, user.id, message)

        return reply.status(201).send({
          success: true,
          data: { conversationId, message },
        })
      } catch (error: any) {
        console.error('Error in with-patient:', error?.message || error)
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: error?.message || "Erreur lors de l'envoi du message",
        })
      }
    },
  )

  // practitioner starts a conversation with another practitioner
  fastify.post(
    '/conversations/with-practitioner',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const body = startConversationWithPractitionerSchema.parse(request.body)

        const practitionerId =
          await messagesService.getPractitionerIdFromUserId(user.id)
        if (!practitionerId) {
          return reply.status(400).send({
            success: false,
            message: 'Profil praticien introuvable',
          })
        }

        // check target practitioner has messaging enabled
        const messagingEnabled =
          await messagesService.isPractitionerMessagingEnabled(
            body.practitioner2Id,
          )
        if (!messagingEnabled) {
          return reply.status(403).send({
            success: false,
            message: "Ce praticien n'a pas activé la messagerie",
          })
        }

        const conversationId =
          await messagesService.getOrCreatePractitionerConversation(
            practitionerId,
            body.practitioner2Id,
            user.id,
          )

        const message = await messagesService.sendMessage(
          conversationId,
          user.id,
          body.content,
        )

        await notifyRecipients(fastify, conversationId, user.id, message)

        return reply.status(201).send({
          success: true,
          data: { conversationId, message },
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: "Erreur lors de l'envoi du message",
        })
      }
    },
  )

  // send message (text)
  fastify.post(
    '/conversations/:id/messages',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const params = request.params as { id: string }
        const conversationId = params.id
        const body = sendMessageSchema.parse(request.body)

        const access = await messagesService.validateConversationAccess(
          conversationId,
          user.id,
        )
        if (!access.valid || !access.conversation) {
          return reply.status(404).send({
            success: false,
            message: 'Conversation introuvable',
          })
        }

        // for patient-practitioner convos, check messaging is enabled (only block patients, not the practitioner themselves)
        if (
          access.conversation.type === 'PATIENT_PRACTITIONER' &&
          !access.conversation.practitioner.messagingEnabled &&
          user.id !== access.conversation.practitioner.user.id
        ) {
          return reply.status(403).send({
            success: false,
            message: 'La messagerie a été désactivée par le praticien',
          })
        }

        const message = await messagesService.sendMessage(
          conversationId,
          user.id,
          body.content,
        )

        await notifyRecipients(fastify, conversationId, user.id, message)

        return reply.status(201).send({
          success: true,
          data: message,
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: "Erreur lors de l'envoi du message",
        })
      }
    },
  )

  // send message with attachment
  fastify.post(
    '/conversations/:id/messages/attachment',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const params = request.params as { id: string }
        const conversationId = params.id

        const access = await messagesService.validateConversationAccess(
          conversationId,
          user.id,
        )
        if (!access.valid || !access.conversation) {
          return reply.status(404).send({
            success: false,
            message: 'Conversation introuvable',
          })
        }

        if (
          access.conversation.type === 'PATIENT_PRACTITIONER' &&
          !access.conversation.practitioner.messagingEnabled &&
          user.id !== access.conversation.practitioner.user.id
        ) {
          return reply.status(403).send({
            success: false,
            message: 'La messagerie a été désactivée par le praticien',
          })
        }

        const data = await (request as any).file()
        if (!data) {
          return reply.status(400).send({
            success: false,
            message: 'Aucun fichier fourni',
          })
        }

        const chunks: Buffer[] = []
        for await (const chunk of data.file) {
          chunks.push(chunk)
        }
        const fileBuffer = Buffer.concat(chunks)

        // check if the file was truncated (size limit exceeded)
        if (data.file.truncated) {
          return reply.status(400).send({
            success: false,
            message: `Le fichier est trop volumineux. Taille maximale : ${FILE_CONSTRAINTS.maxSizeLabel}`,
          })
        }

        let uploadedFile
        try {
          uploadedFile = await saveMessageAttachment(
            fileBuffer,
            data.filename,
            data.mimetype,
          )
        } catch (err: any) {
          return reply.status(400).send({
            success: false,
            message: err.message,
          })
        }

        // optional content from fields
        const contentField = (data.fields as any)?.content
        const content = contentField?.value || '📎 Fichier joint'

        const attachment = {
          originalName: uploadedFile.originalName,
          fileName: uploadedFile.fileName,
          fileSize: uploadedFile.fileSize,
          mimeType: uploadedFile.mimeType,
          url: uploadedFile.url,
        }

        const message = await messagesService.sendMessage(
          conversationId,
          user.id,
          content,
          [attachment],
        )

        await notifyRecipients(fastify, conversationId, user.id, message)

        return reply.status(201).send({
          success: true,
          data: message,
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: "Erreur lors de l'envoi du fichier",
        })
      }
    },
  )

  //  attachment files
  fastify.get(
    '/attachments/:filename',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const params = request.params as { filename: string }
        const filePath = getAttachmentPath(params.filename)

        if (!filePath) {
          return reply.status(404).send({
            success: false,
            message: 'Fichier introuvable',
          })
        }

        const stream = fs.createReadStream(filePath)
        const ext = path.extname(params.filename).toLowerCase()
        const mimeMap: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.heic': 'image/heic',
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.txt': 'text/plain',
        }

        return reply
          .type(mimeMap[ext] || 'application/octet-stream')
          .send(stream)
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la récupération du fichier',
        })
      }
    },
  )

  // mark conversation as read
  fastify.patch(
    '/conversations/:id/read',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const params = request.params as { id: string }
        const conversationId = params.id

        const access = await messagesService.validateConversationAccess(
          conversationId,
          user.id,
        )
        if (!access.valid) {
          return reply.status(404).send({
            success: false,
            message: 'Conversation introuvable',
          })
        }

        const count = await messagesService.markConversationAsRead(
          conversationId,
          user.id,
        )

        // notify sender their messages were read
        if (access.conversation) {
          const recipientIds = await messagesService.getRecipientUserIds(
            conversationId,
            user.id,
          )
          // here "recipient" of the read event is the other user
          for (const recipientId of recipientIds) {
            sendToUser(recipientId, 'messages_read', { conversationId })
          }
        }

        return reply.status(200).send({
          success: true,
          data: { markedAsRead: count },
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors du marquage comme lu',
        })
      }
    },
  )

  // soft delete
  fastify.delete(
    '/conversations/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const params = request.params as { id: string }

        const access = await messagesService.validateConversationAccess(
          params.id,
          user.id,
        )
        if (!access.valid) {
          return reply.status(404).send({
            success: false,
            message: 'Conversation introuvable',
          })
        }

        await messagesService.deleteConversation(params.id, user.id)

        return reply.status(200).send({
          success: true,
          message: 'Conversation supprimée',
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la suppression de la conversation',
        })
      }
    },
  )

  // toggle email mute
  fastify.patch(
    '/conversations/:id/email-mute',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const params = request.params as { id: string }

        const access = await messagesService.validateConversationAccess(
          params.id,
          user.id,
        )
        if (!access.valid) {
          return reply.status(404).send({
            success: false,
            message: 'Conversation introuvable',
          })
        }

        const emailMuted = await messagesService.toggleEmailMute(
          params.id,
          user.id,
        )

        return reply.status(200).send({
          success: true,
          data: { emailMuted },
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la modification des notifications',
        })
      }
    },
  )

  //  messageable practitioners (for PATIENT)
  fastify.get(
    '/practitioners',
    { preHandler: [authenticate, authorize(['PATIENT'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const practitioners = await messagesService.getMessagablePractitioners(
          user.id,
        )
        return reply.status(200).send({
          success: true,
          data: practitioners,
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la récupération des praticiens',
        })
      }
    },
  )

  //  patients that a practitioner can message
  fastify.get(
    '/patients',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const patients = await messagesService.getMessagablePatients(user.id)
        return reply.status(200).send({
          success: true,
          data: patients,
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la récupération des patients',
        })
      }
    },
  )

  //  practitioners that a practitioner can message
  fastify.get(
    '/practitioners-for-practitioner',
    { preHandler: [authenticate, authorize(['PRACTITIONER'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string }
        const practitioners =
          await messagesService.getMessagablePractitionersForPractitioner(
            user.id,
          )
        return reply.status(200).send({
          success: true,
          data: practitioners,
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la récupération des praticiens',
        })
      }
    },
  )

  fastify.get(
    '/unread-count',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const count = await messagesService.getUnreadCount(user.id, user.role)
        return reply.status(200).send({
          success: true,
          data: { count },
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Erreur lors de la récupération du compteur',
        })
      }
    },
  )

  // file  constraints info
  fastify.get(
    '/file-constraints',
    { preHandler: [authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(200).send({
        success: true,
        data: FILE_CONSTRAINTS,
      })
    },
  )
}

async function notifyRecipients(
  fastify: FastifyInstance,
  conversationId: string,
  senderUserId: string,
  message: any,
) {
  const recipientUserIds = await messagesService.getRecipientUserIds(
    conversationId,
    senderUserId,
  )
  const senderName = await messagesService.getSenderDisplayName(senderUserId)
  const messagePreview =
    message.content.length > 100
      ? message.content.substring(0, 100) + '…'
      : message.content

  for (const recipientUserId of recipientUserIds) {
    try {
      // send ws if online
      const isOnline = sendToUser(recipientUserId, 'new_message', {
        ...message,
        conversationId,
      })

      if (!isOnline) {
        await messagesService.createInAppMessageNotification(
          recipientUserId,
          senderName,
          messagePreview,
          conversationId,
          message.id,
        )
      }

      // schedule email if off
      await messagesService.scheduleEmailNotification(
        message.id,
        conversationId,
        recipientUserId,
        senderName,
        messagePreview,
        isOnline,
      )
    } catch (error) {
      fastify.log.error(
        error,
        `Erreur de notification message pour ${recipientUserId}`,
      )
    }
  }
}
