export interface PatientPayment {
  id: string
  appointmentId: string
  amount: number
  currency: string
  method: string
  status: string
  invoiceNumber: string
  paidAt: string | null
  refundedAmount: number | null
  refundedAt: string | null
  refundReason: string | null
  createdAt: string
  appointment: {
    id: string
    appointmentDate: string
    startTime: string
    endTime: string
    type: string
    status: string
    practitioner: {
      id: string
      firstName: string
      lastName: string
      title: string
      specialty: string | null
    }
  }
  invoice: {
    id: string
    invoiceNumber: string
    pdfPath: string | null
  } | null
}

export interface PatientPaymentsResult {
  data: PatientPayment[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SavedPaymentMethodResult {
  id: string
  type: string
  label: string
  isDefault: boolean
  cardLast4: string | null
  cardBrand: string | null
  cardExpMonth: number | null
  cardExpYear: number | null
  mobileOperator: string | null
  mobileNumber: string | null // masked
  isVerified: boolean
  createdAt: string
}

export interface CreatePaymentData {
  appointmentId: string
  patientId: string
  practitionerId: string
  amount: number
  method: string
  savedPaymentMethodId?: string
  // mobile money
  mobileOperator?: string
  mobileNumber?: string
  // card fields (will come from payment in production)
  cardLast4?: string
  cardBrand?: string
}

export interface AddPaymentMethodData {
  type: 'CARD' | 'MOBILE_MONEY'
  label?: string
  isDefault?: boolean
  // card
  cardLast4?: string
  cardBrand?: string
  cardExpMonth?: number
  cardExpYear?: number
  // mobile money
  mobileOperator?: string
  mobileNumber?: string
}

export interface InvoiceDetail {
  id: string
  invoiceNumber: string
  invoiceDate: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  currency: string
  items: any[]
  billedToName: string
  billedToAddress: string | null
  billedToEmail: string | null
  billedToPhone: string | null
  billedFromName: string
  billedFromAddress: string | null
  billedFromLicense: string | null
  pdfPath: string | null
  createdAt: string
  payment: {
    id: string
    method: string
    status: string
    paidAt: string | null
    appointment: {
      id: string
      appointmentDate: string
      startTime: string
      type: string
      practitioner: {
        firstName: string
        lastName: string
        title: string
      }
    }
  }
}
