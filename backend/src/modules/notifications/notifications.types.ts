import type { Prisma } from '@prisma/client'

export interface UserNotification {
  id: string
  type: string
  title: string
  message: string
  metadata: Prisma.JsonValue | null
  read: boolean
  readAt: Date | null
  createdAt: Date
}
