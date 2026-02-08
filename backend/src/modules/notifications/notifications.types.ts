export interface UserNotification {
  id: string
  type: string
  title: string
  message: string
  metadata: any
  read: boolean
  readAt: Date | null
  createdAt: Date
}
