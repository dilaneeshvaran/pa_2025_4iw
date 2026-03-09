export interface CreateContactRequestInput {
  requestType: 'DEMO' | 'INFO' | 'SUPPORT'
  firstName: string
  lastName: string
  email: string
  phone: string
  postalCode: string
  specialty: string
}

export interface CreatePractitionerRequestInput {
  requestType: 'PRACTITIONER'
  firstName: string
  lastName: string
  email: string
  phone: string
  orderNumber: string
  specialty?: string
  clinicAddress: string
  // file path after upload
  identityDocumentPath?: string
  diplomaPath?: string
  orderAttestationPath?: string
}

export interface CreateCabinetRequestInput {
  requestType: 'CABINET'
  firstName: string
  lastName: string
  email: string
  phone: string
  cabinetName: string
  cabinetAddress: string
  adminContactName: string
  adminContactEmail: string
  adminContactPhone: string
  // file path after upload
  cabinetRegDocPath?: string
}

export interface ContactRequestResponse {
  id: string
  requestType: string
  status: string
  firstName: string
  lastName: string
  email: string
  phone: string
  postalCode: string | null
  specialty: string | null
  orderNumber: string | null
  clinicAddress: string | null
  cabinetName: string | null
  cabinetAddress: string | null
  adminContactName: string | null
  adminContactEmail: string | null
  adminContactPhone: string | null
  identityDocumentPath: string | null
  diplomaPath: string | null
  orderAttestationPath: string | null
  cabinetRegDocPath: string | null
  rejectionReason: string | null
  processedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
