import { FastifyInstance, FastifyRequest } from 'fastify'
import websocket from '@fastify/websocket'
import jwt from 'jsonwebtoken'
import type { WebSocket } from 'ws'

// extend fastify with websocket clients map
declare module 'fastify' {
  interface FastifyInstance {
    websocketClients: Map<string, WebSocket>
  }
}

export async function websocketPlugin(fastify: FastifyInstance) {
  // register websocket plugin
  await fastify.register(websocket)

  // store connected clients mapped by userid
  const clients = new Map<string, WebSocket>()
  fastify.decorate('websocketClients', clients)

  // webSocket route for messaging
  fastify.get(
    '/api/ws/messages',
    { websocket: true } as any,
    (socket: any, request: any) => {
      let userId: string | null = null

      // authenticate via query param token
      const url = new URL(
        request.url ?? '',
        `http://${request.headers.host ?? 'localhost'}`,
      )
      const token = url.searchParams.get('token')

      if (!token) {
        socket.close(4001, 'Token requis')
        return
      }

      try {
        const jwtSecret = process.env.BACKEND_JWT_SECRET
        if (!jwtSecret) {
          socket.close(4002, 'Configuration serveur invalide')
          return
        }

        const decoded = jwt.verify(token, jwtSecret) as {
          userId: string
          email: string
          role: string
        }
        userId = decoded.userId

        // register client
        clients.set(userId, socket)

        // send connection confirmation
        socket.send(
          JSON.stringify({
            type: 'connected',
            data: { userId },
          }),
        )

        fastify.log.info(`webSocket client connected: ${userId}`)
      } catch {
        socket.close(4003, 'Token invalide')
        return
      }

      // handle incoming messages (for typing indicators etc)
      socket.on('message', (rawMessage: Buffer) => {
        try {
          const data = JSON.parse(rawMessage.toString())

          if (
            data.type === 'typing' &&
            data.conversationId &&
            data.recipientUserId
          ) {
            // forward typing indicator to recipient
            const recipientSocket = clients.get(data.recipientUserId)
            if (recipientSocket && recipientSocket.readyState === 1) {
              recipientSocket.send(
                JSON.stringify({
                  type: 'typing',
                  data: {
                    conversationId: data.conversationId,
                    userId: userId,
                  },
                }),
              )
            }
          }

          if (
            data.type === 'stop_typing' &&
            data.conversationId &&
            data.recipientUserId
          ) {
            const recipientSocket = clients.get(data.recipientUserId)
            if (recipientSocket && recipientSocket.readyState === 1) {
              recipientSocket.send(
                JSON.stringify({
                  type: 'stop_typing',
                  data: {
                    conversationId: data.conversationId,
                    userId: userId,
                  },
                }),
              )
            }
          }

          // ping/pong keepalive
          // (ping pong means nothing just to detect broken connections)
          if (data.type === 'ping') {
            socket.send(JSON.stringify({ type: 'pong' }))
          }
        } catch {
          // ignore badly formed messages
        }
      })

      // clean up on disconnect
      socket.on('close', () => {
        if (userId) {
          clients.delete(userId)
          fastify.log.info(`webSocket client disconnected: ${userId}`)
        }
      })

      socket.on('error', (error: Error) => {
        fastify.log.error(`webSocket erreor for ${userId}: ${error.message}`)
        if (userId) {
          clients.delete(userId)
        }
      })
    },
  )
}
