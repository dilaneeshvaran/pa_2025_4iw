export interface ConversationSummary {
  id: string
  practitionerId: string
  practitionerFirstName: string
  practitionerLastName: string
  practitionerTitle: string
  practitionerSpecialty: string | null
  lastMessagePreview: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface ConversationSummaryForPractitioner {
  id: string
  patientId: string
  patientFirstName: string
  patientLastName: string
  lastMessagePreview: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface MessageResponse {
  id: string
  conversationId: string
  senderUserId: string
  content: string
  status: string
  readAt: string | null
  createdAt: string
}

export interface ConversationDetail {
  id: string
  patientId: string
  practitionerId: string
  practitioner: {
    id: string
    firstName: string
    lastName: string
    title: string
    specialty: string | null
    messagingEnabled: boolean
  }
  patient: {
    id: string
    firstName: string
    lastName: string
  }
  messages: MessageResponse[]
}
