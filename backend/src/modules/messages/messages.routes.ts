import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { messagesService } from './messages.service'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import {
  sendMessageSchema,
  startConversationSchema,
  getMessagesQuerySchema,
} from './messages.schema'

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

        // get or create conversation
        const conversationId = await messagesService.getOrCreateConversation(
          patientId,
          body.practitionerId,
        )

        // send the first message
        const message = await messagesService.sendMessage(
          conversationId,
          user.id,
          body.content,
        )

        // notify with  webSocket if  recipient is online
        const conversation = await messagesService.getConversation(
          conversationId,
          user.id,
        )

        // broadcast to connected websockets clients
        if (fastify.websocketClients) {
          const practitionerConv =
            await messagesService.validateConversationAccess(
              conversationId,
              user.id,
            )
          if (practitionerConv.conversation) {
            const practitionerUserId =
              practitionerConv.conversation.practitioner.user.id
            const client = fastify.websocketClients.get(practitionerUserId)
            if (client && client.readyState === 1) {
              client.send(
                JSON.stringify({
                  type: 'new_message',
                  data: {
                    ...message,
                    conversationId,
                  },
                }),
              )
            }
          }
        }

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

  // send  message
  fastify.post(
    '/conversations/:id/messages',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string; role: string }
        const params = request.params as { id: string }
        const conversationId = params.id
        const body = sendMessageSchema.parse(request.body)

        //validate access
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

        if (!access.conversation.practitioner.messagingEnabled) {
          return reply.status(403).send({
            success: false,
            message: 'La messagerie a été désactivée par le praticien',
          })
        }

        // send message
        const message = await messagesService.sendMessage(
          conversationId,
          user.id,
          body.content,
        )

        // notify the other side with ws if online
        if (fastify.websocketClients) {
          const patientUserId = access.conversation.patient.user.id
          const practitionerUserId = access.conversation.practitioner.user.id
          const recipientUserId =
            user.id === patientUserId ? practitionerUserId : patientUserId

          const client = fastify.websocketClients.get(recipientUserId)
          if (client && client.readyState === 1) {
            client.send(
              JSON.stringify({
                type: 'new_message',
                data: {
                  ...message,
                  conversationId,
                },
              }),
            )
          }
        }

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

  //  mark conversation as read
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

        // notify sender their messages were read with ws if online
        if (fastify.websocketClients && access.conversation) {
          const patientUserId = access.conversation.patient.user.id
          const practitionerUserId = access.conversation.practitioner.user.id
          const otherUserId =
            user.id === patientUserId ? practitionerUserId : patientUserId

          const client = fastify.websocketClients.get(otherUserId)
          if (client && client.readyState === 1) {
            client.send(
              JSON.stringify({
                type: 'messages_read',
                data: { conversationId },
              }),
            )
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

  // list practitioners patient can message
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

  //  get total unread messages count
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
}
