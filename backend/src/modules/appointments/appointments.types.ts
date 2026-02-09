export interface PatientAppointment {
  id: string
  appointmentDate: Date
  startTime: string
  endTime: string
  type: string
  status: string
  reason: string | null
  consultationFee: number
  practitioner: {
    id: string
    firstName: string
    lastName: string
    title: string
    specialty: string | null
    photo: string | null
  }
}

export interface PatientAppointmentsResult {
  data: PatientAppointment[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateAppointmentData {
  practitionerId: string
  patientId: string
  appointmentDate: string
  startTime: string
  type: 'IN_PERSON' | 'TELECONSULTATION'
  reason?: string
}

export interface AppointmentCreatedResult {
  id: string
  appointmentDate: Date
  startTime: string
  endTime: string
  type: string
  status: string
  reason: string | null
  consultationFee: number
  practitioner: {
    id: string
    firstName: string
    lastName: string
    title: string
    specialty: string | null
  }
}
