export interface ConversationSummary {
  id: string
  type: string
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
  type: string
  //  patient conv
  patientId?: string
  patientFirstName?: string
  patientLastName?: string
  //  practitioner to practitioner
  otherPractitionerId?: string
  otherPractitionerFirstName?: string
  otherPractitionerLastName?: string
  otherPractitionerTitle?: string
  otherPractitionerSpecialty?: string | null
  // common
  lastMessagePreview: string | null
  lastMessageAt: string | null
  unreadCount: number
  emailMuted: boolean
}

export interface MessageAttachment {
  originalName: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
}

export interface MessageResponse {
  id: string
  conversationId: string
  senderUserId: string
  content: string
  attachments: MessageAttachment[] | null
  status: string
  readAt: string | null
  createdAt: string
}

export interface ConversationDetail {
  id: string
  type: string
  patientId: string | null
  practitionerId: string
  practitioner2Id: string | null
  practitioner: {
    id: string
    userId: string
    firstName: string
    lastName: string
    title: string
    specialty: string | null
    messagingEnabled: boolean
  }
  practitioner2?: {
    id: string
    userId: string
    firstName: string
    lastName: string
    title: string
    specialty: string | null
  } | null
  patient?: {
    id: string
    userId: string
    firstName: string
    lastName: string
  } | null
  messages: MessageResponse[]
  emailMuted: boolean
}
