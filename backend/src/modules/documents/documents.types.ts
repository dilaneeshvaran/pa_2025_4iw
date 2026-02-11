export interface ReceivedDocument {
  id: string
  type: string
  title: string
  description: string | null
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  practitioner: {
    firstName: string
    lastName: string
    title: string
  } | null
}

export interface PatientUploadedDocument {
  id: string
  type: string
  title: string
  description: string | null
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

export interface DocumentListResult {
  data: ReceivedDocument[]
  total: number
  counts: {
    all: number
    prescriptions: number
    exams: number
    certificates: number
    others: number
  }
}

export interface PatientDocumentListResult {
  data: PatientUploadedDocument[]
  total: number
  counts: {
    all: number
    prescriptions: number
    exams: number
    certificates: number
    others: number
  }
}
