import { FastifyInstance, FastifyRequest } from 'fastify'
import websocket from '@fastify/websocket'
import jwt from 'jsonwebtoken'
import type { WebSocket } from 'ws'

// module level clients map any module can send ws events
// without fastify  decorator scope.
const clients = new Map<string, WebSocket>()
export { clients as wsClients }

//send if online
export function sendToUser(
  userId: string,
  type: string,
  data: unknown,
): boolean {
  const client = clients.get(userId)
  if (client && client.readyState === 1) {
    client.send(JSON.stringify({ type, data }))
    return true
  }
  return false
}

// send to many users and return to whm its sent
export function broadcastToUsers(
  userIds: string[],
  type: string,
  data: unknown,
): string[] {
  const delivered: string[] = []
  for (const userId of userIds) {
    if (sendToUser(userId, type, data)) {
      delivered.push(userId)
    }
  }
  return delivered
}

export async function websocketPlugin(fastify: FastifyInstance) {
  // register websocket plugin
  await fastify.register(websocket)

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

          // webrtc signaling for teleconsultation
          if (
            data.type === 'webrtc_offer' &&
            data.targetUserId &&
            data.signal
          ) {
            const targetSocket = clients.get(data.targetUserId)
            if (targetSocket && targetSocket.readyState === 1) {
              targetSocket.send(
                JSON.stringify({
                  type: 'webrtc_offer',
                  data: {
                    signal: data.signal,
                    fromUserId: userId,
                    sessionId: data.sessionId,
                  },
                }),
              )
            }
          }

          if (
            data.type === 'webrtc_answer' &&
            data.targetUserId &&
            data.signal
          ) {
            const targetSocket = clients.get(data.targetUserId)
            if (targetSocket && targetSocket.readyState === 1) {
              targetSocket.send(
                JSON.stringify({
                  type: 'webrtc_answer',
                  data: {
                    signal: data.signal,
                    fromUserId: userId,
                    sessionId: data.sessionId,
                  },
                }),
              )
            }
          }

          if (
            data.type === 'webrtc_ice_candidate' &&
            data.targetUserId &&
            data.candidate
          ) {
            const targetSocket = clients.get(data.targetUserId)
            if (targetSocket && targetSocket.readyState === 1) {
              targetSocket.send(
                JSON.stringify({
                  type: 'webrtc_ice_candidate',
                  data: {
                    candidate: data.candidate,
                    fromUserId: userId,
                    sessionId: data.sessionId,
                  },
                }),
              )
            }
          }

          // teleconsultation chat message
          if (
            data.type === 'teleconsult_chat' &&
            data.targetUserId &&
            data.message
          ) {
            const targetSocket = clients.get(data.targetUserId)
            if (targetSocket && targetSocket.readyState === 1) {
              targetSocket.send(
                JSON.stringify({
                  type: 'teleconsult_chat',
                  data: {
                    message: data.message,
                    fromUserId: userId,
                    sessionId: data.sessionId,
                    timestamp: new Date().toISOString(),
                  },
                }),
              )
            }
          }

          // teleconsultation session events (join/leave notifications)
          if (data.type === 'teleconsult_joined' && data.targetUserId) {
            const targetSocket = clients.get(data.targetUserId)
            if (targetSocket && targetSocket.readyState === 1) {
              targetSocket.send(
                JSON.stringify({
                  type: 'teleconsult_joined',
                  data: {
                    userId: userId,
                    sessionId: data.sessionId,
                  },
                }),
              )
            }
          }

          if (data.type === 'teleconsult_left' && data.targetUserId) {
            const targetSocket = clients.get(data.targetUserId)
            if (targetSocket && targetSocket.readyState === 1) {
              targetSocket.send(
                JSON.stringify({
                  type: 'teleconsult_left',
                  data: {
                    userId: userId,
                    sessionId: data.sessionId,
                  },
                }),
              )
            }
          }

          // screen sharing state
          if (data.type === 'screen_share_started' && data.targetUserId) {
            const targetSocket = clients.get(data.targetUserId)
            if (targetSocket && targetSocket.readyState === 1) {
              targetSocket.send(
                JSON.stringify({
                  type: 'screen_share_started',
                  data: { userId: userId, sessionId: data.sessionId },
                }),
              )
            }
          }

          if (data.type === 'screen_share_stopped' && data.targetUserId) {
            const targetSocket = clients.get(data.targetUserId)
            if (targetSocket && targetSocket.readyState === 1) {
              targetSocket.send(
                JSON.stringify({
                  type: 'screen_share_stopped',
                  data: { userId: userId, sessionId: data.sessionId },
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
