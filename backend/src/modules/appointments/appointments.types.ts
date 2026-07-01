export interface PatientAppointment {
  id: string
  appointmentDate: Date
  startTime: string
  endTime: string
  type: string
  status: string
  reason: string | null
  consultationFee: number
  earlierSlotAlertEnabled: boolean
  practitioner: {
    id: string
    firstName: string
    lastName: string
    title: string
    specialty: string | null
    photo: string | null
    address: string | null
    city: string | null
    cancellationNotice: number
  }
  cabinet?: {
    id: string
    name: string
    address: string
    city: string | null
  } | null
  teleconsultationSession?: {
    id: string
    roomId: string
    roomName: string
    status: string
    duration: number | null
    startedAt: Date | null
    endedAt: Date | null
    connectionQuality: string | null
  } | null
  review?: {
    id: string
    rating: number
    comment: string | null
    createdAt: Date
  } | null
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
  cabinetId?: string
  appointmentDate: string
  startTime: string
  type: 'IN_PERSON' | 'TELECONSULTATION'
  reason?: string
  timezoneOffset?: string
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

export interface UpdateAppointmentData {
  appointmentDate?: string
  startTime?: string
}
