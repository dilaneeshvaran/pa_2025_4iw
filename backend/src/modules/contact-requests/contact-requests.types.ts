export interface CreateContactRequestInput {
  requestType: 'DEMO' | 'INFO' | 'SUPPORT'
  firstName: string
  lastName: string
  email: string
  phone: string
  postalCode: string
  specialty: string
}

export interface ContactRequestResponse {
  id: string
  requestType: string
  status: string
  firstName: string
  lastName: string
  email: string
  phone: string
  postalCode: string
  specialty: string
  createdAt: Date
  updatedAt: Date
}
